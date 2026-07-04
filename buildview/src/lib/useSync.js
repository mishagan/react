import {useSyncExternalStore} from 'react';
import {getSyncStatus, onSyncStatus} from '../data/sync.js';

// Subscribe a component to the sync engine's status:
// 'off' | 'syncing' | 'live' | 'queued' (offline writes waiting to push).
export function useSyncStatus() {
  return useSyncExternalStore(
    cb => onSyncStatus(cb),
    getSyncStatus,
    getSyncStatus
  );
}
