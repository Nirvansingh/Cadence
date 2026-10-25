import { supabase } from './supabaseClient';
import { storage } from './storageAdapter';
import type { CadenceBackupData } from '../types';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

class CloudSyncService {
  private syncStatus: SyncStatus = 'offline';
  private listeners: ((status: SyncStatus) => void)[] = [];
  private debounceTimer: any = null;

  constructor() {
    this.init();
    this.setupAutoSync();
  }

  private async init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.setStatus('synced');
    } else {
      this.setStatus('offline');
    }
  }

  private setupAutoSync() {
    storage.subscribe(() => {
      // Auto-push with 2s debounce if logged in
      if (this.syncStatus === 'synced') {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.pushLocalToCloud();
        }, 2000);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.setStatus('synced');
      } else {
        this.setStatus('offline');
      }
    });
  }

  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    listener(this.syncStatus);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private setStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.listeners.forEach(l => l(status));
  }

  // Upload local data to Supabase cloud
  async pushLocalToCloud(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.setStatus('offline');
        return { success: false, error: 'User not signed in.' };
      }

      this.setStatus('syncing');
      const backupJson = storage.exportBackup();
      const payload: CadenceBackupData = JSON.parse(backupJson);

      // Attempt 1: Try sync table
      const { error: tableError } = await supabase
        .from('cadence_sync')
        .upsert({
          user_id: user.id,
          payload,
          updated_at: new Date().toISOString()
        });

      if (tableError) {
        // Fallback: Store inside user_metadata so it works with zero SQL configuration needed
        const { error: metaError } = await supabase.auth.updateUser({
          data: {
            cadence_backup: payload,
            cadence_synced_at: new Date().toISOString()
          }
        });

        if (metaError) {
          this.setStatus('error');
          return { success: false, error: metaError.message };
        }
      }

      this.setStatus('synced');
      return { success: true };
    } catch (err: any) {
      this.setStatus('error');
      return { success: false, error: err.message || 'Sync failed.' };
    }
  }

  // Download cloud data into local storage
  async pullCloudToLocal(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.setStatus('offline');
        return { success: false, error: 'User not signed in.' };
      }

      this.setStatus('syncing');

      // Attempt 1: Fetch from table
      const { data, error } = await supabase
        .from('cadence_sync')
        .select('payload')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.payload) {
        storage.importBackup(JSON.stringify(data.payload));
        this.setStatus('synced');
        return { success: true };
      }

      // Fallback: Fetch from user metadata
      if (user.user_metadata?.cadence_backup) {
        storage.importBackup(JSON.stringify(user.user_metadata.cadence_backup));
        this.setStatus('synced');
        return { success: true };
      }

      // If no remote data yet, push local up
      return await this.pushLocalToCloud();
    } catch (err: any) {
      this.setStatus('error');
      return { success: false, error: err.message || 'Pull failed.' };
    }
  }
}

export const cloudSync = new CloudSyncService();
