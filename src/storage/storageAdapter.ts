import type { Habit, HabitLog, TimetableSlot, NoteItem, TaskItem, UserProfile, CadenceBackupData, FocusLog } from '../types';

const STORAGE_KEYS = {
  ONBOARDING_DONE: 'cadence_onboarded_v1',
  PROFILE: 'cadence_profile_v1',
  HABITS: 'cadence_habits_v1',
  HABIT_LOGS: 'cadence_habit_logs_v1',
  TIMETABLE: 'cadence_timetable_v1',
  NOTES: 'cadence_notes_v1',
  TASKS: 'cadence_tasks_v1',
  FOCUS_LOGS: 'cadence_focus_logs_v1',
};

class LocalStorageAdapter {
  // Onboarding status
  isOnboardingCompleted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE) === 'true';
  }

  setOnboardingCompleted(val: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, val ? 'true' : 'false');
  }

  // Profile
  getProfile(): UserProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      const defaultProfile: UserProfile = {
        id: 'user_local',
        displayName: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        theme: 'oled-dark',
        soundEnabled: true,
        autoLockMinutes: 5,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      return defaultProfile;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        id: 'user_local',
        displayName: '',
        timezone: 'UTC',
        theme: 'oled-dark',
        soundEnabled: true,
        autoLockMinutes: 5,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
  }

  setProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  // Habits (Start clean, zero fake demo data)
  getHabits(): Habit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setHabits(habits: Habit[]): void {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }

  // Habit Logs
  getHabitLogs(): HabitLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setHabitLogs(logs: HabitLog[]): void {
    localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs));
  }

  toggleHabitLog(habitId: string, dateStr: string): boolean {
    const logs = this.getHabitLogs();
    const existingIndex = logs.findIndex(l => l.habitId === habitId && l.completedDate === dateStr);
    let isCompleted = false;

    if (existingIndex >= 0) {
      logs.splice(existingIndex, 1);
      isCompleted = false;
    } else {
      logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        habitId,
        completedDate: dateStr,
        completedAt: Date.now()
      });
      isCompleted = true;
    }
    this.setHabitLogs(logs);
    return isCompleted;
  }

  // Timetable
  getTimetable(): TimetableSlot[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setTimetable(slots: TimetableSlot[]): void {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(slots));
  }

  // Tasks
  getTasks(): TaskItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setTasks(tasks: TaskItem[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  // Notes
  getNotes(): NoteItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setNotes(notes: NoteItem[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }

  // Focus Sessions
  getFocusLogs(): FocusLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FOCUS_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  setFocusLogs(logs: FocusLog[]): void {
    localStorage.setItem(STORAGE_KEYS.FOCUS_LOGS, JSON.stringify(logs));
  }

  addFocusLog(minutes: number): FocusLog {
    const logs = this.getFocusLogs();
    const today = new Date().toISOString().split('T')[0];
    const newLog: FocusLog = {
      id: `fl_${Date.now()}`,
      dateStr: today,
      minutes,
      timestamp: Date.now()
    };
    const updated = [newLog, ...logs];
    this.setFocusLogs(updated);
    return newLog;
  }

  // Complete clean slate onboarding initialization
  initializeFromOnboarding(params: {
    displayName: string;
    wakeTime: string;
    sleepTime: string;
    primaryFocus: string;
    firstHabitTitle: string;
    firstHabitCue: string;
    firstHabitRoutine: string;
    firstHabitReward: string;
  }): void {
    // 1. Profile
    const profile = this.getProfile();
    profile.displayName = params.displayName;
    this.setProfile(profile);

    // 2. Initial real Schedule (Sleep & Wake blocks across Monday-Sunday)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    const initialSlots: TimetableSlot[] = [];

    days.forEach((day, index) => {
      // Sleep block
      initialSlots.push({
        id: `slot_sleep_${day.toLowerCase()}`,
        dayOfWeek: day,
        startTime: params.sleepTime,
        endTime: params.wakeTime,
        title: 'Rest & Sleep',
        category: 'sleep',
        note: 'Restorative sleep',
        sortOrder: 1,
        createdAt: Date.now() + index,
        updatedAt: Date.now() + index
      });

      // Dedicated Focus block
      if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)) {
        initialSlots.push({
          id: `slot_focus_${day.toLowerCase()}`,
          dayOfWeek: day,
          startTime: '16:00',
          endTime: '18:00',
          title: `${params.primaryFocus} Study Block`,
          category: 'study',
          note: 'Deep focus time',
          sortOrder: 2,
          createdAt: Date.now() + index + 10,
          updatedAt: Date.now() + index + 10
        });
      }
    });
    this.setTimetable(initialSlots);

    // 3. First Habit Loop (User's real chosen routine)
    if (params.firstHabitTitle.trim()) {
      const firstHabit: Habit = {
        id: `h_anchor_${Date.now()}`,
        title: params.firstHabitTitle.trim(),
        category: 'study',
        timeOfDay: 'morning',
        cue: params.firstHabitCue.trim() || 'Morning trigger',
        routine: params.firstHabitRoutine.trim() || 'Execute micro-step',
        reward: params.firstHabitReward.trim() || 'Mental clarity',
        targetDaysMask: 127,
        sortOrder: 1,
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.setHabits([firstHabit]);
    }

    this.setOnboardingCompleted(true);
  }

  // Backup & Restore
  exportBackup(): string {
    const data: CadenceBackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      habits: this.getHabits(),
      habitLogs: this.getHabitLogs(),
      timetable: this.getTimetable(),
      notes: this.getNotes(),
      tasks: this.getTasks(),
      focusLogs: this.getFocusLogs()
    };
    return JSON.stringify(data, null, 2);
  }

  importBackup(jsonString: string): boolean {
    try {
      const data: CadenceBackupData = JSON.parse(jsonString);
      if (data.profile) this.setProfile(data.profile);
      if (data.habits) this.setHabits(data.habits);
      if (data.habitLogs) this.setHabitLogs(data.habitLogs);
      if (data.timetable) this.setTimetable(data.timetable);
      if (data.notes) this.setNotes(data.notes);
      if (data.tasks) this.setTasks(data.tasks);
      if (data.focusLogs) this.setFocusLogs(data.focusLogs);
      this.setOnboardingCompleted(true);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new LocalStorageAdapter();
