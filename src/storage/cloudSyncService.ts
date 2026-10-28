import { syncEngine, type SyncStatus } from './syncEngine';

/**
 * CloudSyncAdapter provides backward compatibility with the existing
 * CloudSyncModal, AuthPage, and UI components while routing all operations
 * through the robust, granular SyncEngine.
 */
class CloudSyncAdapter {
  getStatus(): SyncStatus {
    return syncEngine.getStatus();
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    return syncEngine.subscribeStatus(listener);
  }

  // Upload/flush pending mutations to cloud
  async pushLocalToCloud(): Promise<{ success: boolean; error?: string }> {
    try {
      await syncEngine.flushMutationQueue();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Push failed' };
    }
  }

  // Pull latest remote records from cloud
  async pullCloudToLocal(): Promise<{ success: boolean; error?: string }> {
    try {
      await syncEngine.pullRemoteChanges();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Pull failed' };
    }
  }

  // Re-synchronize both ways
  async syncNow(): Promise<void> {
    await syncEngine.synchronize();
  }
}

export const cloudSync = new CloudSyncAdapter();
export type { SyncStatus };
