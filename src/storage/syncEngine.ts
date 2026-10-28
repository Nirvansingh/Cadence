import { supabase } from './supabaseClient';
import { storage } from './storageAdapter';
import type { TaskItem, Habit, NoteItem, TimetableSlot, StreakState } from '../types';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

interface OfflineMutation {
  id: string;
  table: 'tasks' | 'habits' | 'habit_logs' | 'notes' | 'timetable_slots' | 'focus_logs' | 'user_streaks';
  record: any;
  action: 'upsert' | 'delete';
  timestamp: number;
}

const MUTATION_QUEUE_KEY = 'cadence_sync_mutation_queue_v1';
const LAST_SYNC_KEY = 'cadence_last_sync_timestamp_v1';

class SyncEngine {
  private syncStatus: SyncStatus = 'offline';
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private isSyncing = false;
  private realtimeChannel: any = null;
  private currentUser: any = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Check initial auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = session.user;
      this.setStatus('synced');
      this.setupRealtimeSubscription(session.user.id);
      this.synchronize();
    } else {
      this.setStatus('offline');
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        this.currentUser = session.user;
        this.setStatus('synced');
        this.setupRealtimeSubscription(session.user.id);
        await this.handleInitialUserLogin(session.user.id);
      } else {
        this.currentUser = null;
        this.cleanupRealtimeSubscription();
        this.setStatus('offline');
      }
    });

    // Automatically retry queue when online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.currentUser) {
          this.flushMutationQueue();
          this.pullRemoteChanges();
        }
      });
    }
  }

  public getStatus(): SyncStatus {
    return this.syncStatus;
  }

  public subscribeStatus(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.syncStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private setStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (err) {
        console.error('SyncEngine status listener error:', err);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Realtime WebSocket Subscription
  // ---------------------------------------------------------------------------
  private setupRealtimeSubscription(userId: string) {
    this.cleanupRealtimeSubscription();

    try {
      this.realtimeChannel = supabase
        .channel(`cadence_user_${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', filter: `user_id=eq.${userId}` },
          (_payload) => {
            // Incremental changes pushed from other device
            this.pullRemoteChanges();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription setup failed:', err);
    }
  }

  private cleanupRealtimeSubscription() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Mutation Queue (Offline & Retries)
  // ---------------------------------------------------------------------------
  private getMutationQueue(): OfflineMutation[] {
    try {
      const raw = localStorage.getItem(MUTATION_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setMutationQueue(queue: OfflineMutation[]): void {
    try {
      localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('Failed to save mutation queue:', err);
    }
  }

  public enqueueMutation(
    table: OfflineMutation['table'],
    record: any,
    action: 'upsert' | 'delete' = 'upsert'
  ): void {
    const queue = this.getMutationQueue();
    // Coalesce mutations for the same record ID to avoid redundant work
    const existingIndex = queue.findIndex(m => m.table === table && m.record.id === record.id);
    const mutation: OfflineMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      table,
      record,
      action,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      queue[existingIndex] = mutation;
    } else {
      queue.push(mutation);
    }

    this.setMutationQueue(queue);

    if (this.currentUser && navigator.onLine) {
      this.flushMutationQueue();
    }
  }

  public async flushMutationQueue(): Promise<void> {
    if (!this.currentUser || !navigator.onLine) return;
    const queue = this.getMutationQueue();
    if (queue.length === 0) return;

    this.setStatus('syncing');
    const remaining: OfflineMutation[] = [];

    for (const item of queue) {
      try {
        const payload = {
          ...item.record,
          user_id: this.currentUser.id,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from(item.table)
          .upsert(payload, { onConflict: item.table === 'user_streaks' ? 'user_id' : 'id' });

        if (error) {
          console.error(`Failed to push mutation for ${item.table}:`, error.message);
          remaining.push(item);
        }
      } catch (err: any) {
        console.error(`Mutation exception on ${item.table}:`, err?.message || err);
        remaining.push(item);
      }
    }

    this.setMutationQueue(remaining);
    this.setStatus(remaining.length === 0 ? 'synced' : 'error');
  }

  // ---------------------------------------------------------------------------
  // Pull Remote Changes (Incremental Delta Sync)
  // ---------------------------------------------------------------------------
  public async pullRemoteChanges(): Promise<void> {
    if (!this.currentUser || !navigator.onLine || this.isSyncing) return;
    this.isSyncing = true;
    this.setStatus('syncing');

    try {
      const userId = this.currentUser.id;

      // 1. Pull Tasks
      const { data: remoteTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      if (remoteTasks) {
        this.reconcileTasks(remoteTasks);
      }

      // 2. Pull Notes
      const { data: remoteNotes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId);

      if (remoteNotes) {
        this.reconcileNotes(remoteNotes);
      }

      // 3. Pull Habits
      const { data: remoteHabits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId);

      if (remoteHabits) {
        this.reconcileHabits(remoteHabits);
      }

      // 4. Pull Timetable Slots
      const { data: remoteSlots } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('user_id', userId);

      if (remoteSlots) {
        this.reconcileTimetable(remoteSlots);
      }

      // 5. Pull Streaks
      const { data: remoteStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (remoteStreak) {
        this.reconcileStreak(remoteStreak);
      }

      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      this.setStatus('synced');
    } catch (err) {
      console.error('Remote sync pull error:', err);
      this.setStatus('error');
    } finally {
      this.isSyncing = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Reconcilers (Last-Write-Wins with Tombstones)
  // ---------------------------------------------------------------------------
  private reconcileTasks(remoteTasks: any[]) {
    const localTasks = storage.getTasks();
    const taskMap = new Map<string, TaskItem>();
    localTasks.forEach(t => taskMap.set(t.id, t));

    remoteTasks.forEach(rt => {
      // If deleted remotely, remove locally
      if (rt.is_deleted) {
        taskMap.delete(rt.id);
        return;
      }

      const local = taskMap.get(rt.id);
      const remoteUpdatedAt = new Date(rt.updated_at).getTime();

      if (!local || remoteUpdatedAt > (local.updatedAt || 0)) {
        taskMap.set(rt.id, {
          id: rt.id,
          user_id: rt.user_id,
          title: rt.title,
          description: rt.description || '',
          status: rt.status,
          priority: rt.priority,
          dueDate: rt.due_date || undefined,
          tags: rt.tags || [],
          subtasks: rt.subtasks || [],
          sortOrder: rt.sort_order || 0,
          is_deleted: false,
          createdAt: new Date(rt.created_at).getTime(),
          updatedAt: remoteUpdatedAt
        });
      }
    });

    storage.setTasks(Array.from(taskMap.values()), true);
  }

  private reconcileNotes(remoteNotes: any[]) {
    const localNotes = storage.getNotes();
    const noteMap = new Map<string, NoteItem>();
    localNotes.forEach(n => noteMap.set(n.id, n));

    remoteNotes.forEach(rn => {
      if (rn.is_deleted) {
        noteMap.delete(rn.id);
        return;
      }

      const local = noteMap.get(rn.id);
      const remoteUpdatedAt = new Date(rn.updated_at).getTime();

      if (!local || remoteUpdatedAt > (local.updatedAt || 0)) {
        noteMap.set(rn.id, {
          id: rn.id,
          user_id: rn.user_id,
          title: rn.title,
          content: rn.content || '',
          tags: rn.tags || [],
          isPinned: rn.is_pinned || false,
          is_deleted: false,
          createdAt: new Date(rn.created_at).getTime(),
          updatedAt: remoteUpdatedAt
        });
      }
    });

    storage.setNotes(Array.from(noteMap.values()), true);
  }

  private reconcileHabits(remoteHabits: any[]) {
    const localHabits = storage.getHabits();
    const habitMap = new Map<string, Habit>();
    localHabits.forEach(h => habitMap.set(h.id, h));

    remoteHabits.forEach(rh => {
      if (rh.is_deleted) {
        habitMap.delete(rh.id);
        return;
      }

      const local = habitMap.get(rh.id);
      const remoteUpdatedAt = new Date(rh.updated_at).getTime();

      if (!local || remoteUpdatedAt > (local.updatedAt || 0)) {
        habitMap.set(rh.id, {
          id: rh.id,
          user_id: rh.user_id,
          title: rh.title,
          category: rh.category,
          timeOfDay: rh.time_of_day,
          cue: rh.cue || '',
          routine: rh.routine || '',
          reward: rh.reward || '',
          icon: rh.icon,
          color: rh.color,
          targetDaysMask: rh.target_days_mask ?? 127,
          frequency: rh.frequency || 'daily',
          stackAfterHabitId: rh.stack_after_habit_id,
          sortOrder: rh.sort_order || 0,
          isArchived: rh.is_archived || false,
          is_deleted: false,
          createdAt: new Date(rh.created_at).getTime(),
          updatedAt: remoteUpdatedAt
        });
      }
    });

    storage.setHabits(Array.from(habitMap.values()));
  }

  private reconcileTimetable(remoteSlots: any[]) {
    const localSlots = storage.getTimetable();
    const slotMap = new Map<string, TimetableSlot>();
    localSlots.forEach(s => slotMap.set(s.id, s));

    remoteSlots.forEach(rs => {
      if (rs.is_deleted) {
        slotMap.delete(rs.id);
        return;
      }

      const local = slotMap.get(rs.id);
      const remoteUpdatedAt = new Date(rs.updated_at).getTime();

      if (!local || remoteUpdatedAt > (local.updatedAt || 0)) {
        slotMap.set(rs.id, {
          id: rs.id,
          user_id: rs.user_id,
          dayOfWeek: rs.day_of_week,
          startTime: rs.start_time,
          endTime: rs.end_time,
          title: rs.title,
          category: rs.category,
          note: rs.note,
          sortOrder: rs.sort_order || 0,
          is_deleted: false,
          createdAt: new Date(rs.created_at).getTime(),
          updatedAt: remoteUpdatedAt
        });
      }
    });

    storage.setTimetable(Array.from(slotMap.values()));
  }

  private reconcileStreak(remoteStreak: any) {
    const local = storage.getStreakState();
    const merged: StreakState = {
      currentStreak: Math.max(local.currentStreak, remoteStreak.current_streak || 0),
      bestStreak: Math.max(local.bestStreak, remoteStreak.best_streak || 0),
      lastActiveDate: remoteStreak.last_active_date || local.lastActiveDate,
      freezesAvailable: remoteStreak.freezes_available ?? local.freezesAvailable,
      freezeDates: Array.from(new Set([...local.freezeDates, ...(remoteStreak.freeze_dates || [])])),
      activeDates: Array.from(new Set([...local.activeDates, ...(remoteStreak.active_dates || [])]))
    };
    storage.setStreakState(merged);
  }

  // ---------------------------------------------------------------------------
  // Account Linking (Migrating Anonymous Local Workspace)
  // ---------------------------------------------------------------------------
  private async handleInitialUserLogin(userId: string) {
    // 1. Check if cloud has existing records
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const hasCloudData = (count || 0) > 0;

    if (!hasCloudData) {
      // First-time sign in: Upload existing local workspace items
      const localTasks = storage.getTasks();
      const localNotes = storage.getNotes();
      const localHabits = storage.getHabits();
      const localTimetable = storage.getTimetable();

      localTasks.forEach(t => this.enqueueMutation('tasks', { ...t, user_id: userId }));
      localNotes.forEach(n => this.enqueueMutation('notes', { ...n, user_id: userId }));
      localHabits.forEach(h => this.enqueueMutation('habits', { ...h, user_id: userId }));
      localTimetable.forEach(s => this.enqueueMutation('timetable_slots', { ...s, user_id: userId }));
      
      await this.flushMutationQueue();
    } else {
      // Account already has cloud data: pull it down
      await this.pullRemoteChanges();
    }
  }

  // General trigger to perform full synchronization
  public async synchronize(): Promise<void> {
    await this.flushMutationQueue();
    await this.pullRemoteChanges();
  }
}

export const syncEngine = new SyncEngine();
