// =============================================================================
// Remote sync engine (local-first).
//
// Reads stay synchronous from db.js's in-memory cache, so no screen changes.
// Local writes apply instantly (optimistic) and are queued here; the queue is
// persisted so work done offline on site survives a reload and pushes when
// connectivity returns. Inbound remote changes (initial pull + realtime) are
// applied through db.__applyRemote*, which last-write-wins on updatedAt so a
// device's own echoes are no-ops.
//
// The remote is pluggable: anything with {pullAll, upsert, remove, subscribe}
// works — data/remote/supabaseRemote.js in production, a fake in tests.
// =============================================================================
import {db, COLLECTIONS} from './db.js';

const QUEUE_KEY = 'buildview:pushqueue:v1';
const RETRY_BASE_MS = 3000;
const RETRY_MAX_MS = 60000;

let remote = null;
let queue = [];
let flushing = false;
let retryMs = RETRY_BASE_MS;
let retryTimer = null;
let unsubscribeRemote = null;

const statusListeners = new Set();
let status = 'off'; // off | syncing | live | queued (pending pushes)

function setStatus(s) {
  if (status === s) return;
  status = s;
  for (const fn of statusListeners) fn(status);
}

export function getSyncStatus() {
  return status;
}

export function onSyncStatus(fn) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue() {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('BuildView sync: could not persist push queue.', err);
  }
}

function enqueue(op) {
  // Collapse superseded ops: a newer upsert/delete for the same row replaces
  // the queued one, so a flaky connection doesn't replay stale writes.
  queue = queue.filter(q => !(q.collection === op.collection && q.id === op.id));
  queue.push(op);
  saveQueue();
  void flush();
}

async function flush() {
  if (flushing || !remote) return;
  flushing = true;
  try {
    while (queue.length > 0) {
      const op = queue[0];
      if (op.type === 'upsert') await remote.upsert(op.collection, op.row);
      else await remote.remove(op.collection, op.id);
      queue.shift();
      saveQueue();
      retryMs = RETRY_BASE_MS;
    }
    setStatus('live');
  } catch (err) {
    // Push failed (offline / server hiccup): keep the queue, retry with
    // backoff. Local UI already reflects the write.
    setStatus('queued');
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => void flush(), retryMs);
    retryMs = Math.min(retryMs * 2, RETRY_MAX_MS);
  } finally {
    flushing = false;
  }
}

// Attach the remote: initial full pull hydrates the cache, then local writes
// mirror into the queue and remote events stream back in.
export async function startSync(r) {
  stopSync();
  remote = r;
  setStatus('syncing');

  queue = loadQueue();

  // 1. Full pull → hydrate (only when the pull succeeds; otherwise we keep
  //    the cached offline copy and retry pushes/pulls as usual).
  const snapshot = await remote.pullAll();
  const full = {};
  for (const name of COLLECTIONS) full[name] = snapshot[name] || [];
  db.__hydrate(full);

  // 2. Mirror local writes into the durable push queue.
  db.__setMirror({
    upsert(collection, row) {
      enqueue({type: 'upsert', collection, id: row.id, row});
    },
    remove(collection, id) {
      enqueue({type: 'remove', collection, id});
    },
  });

  // 3. Live changes from other devices.
  if (remote.subscribe) {
    unsubscribeRemote = remote.subscribe((collection, event, payload) => {
      if (!COLLECTIONS.includes(collection)) return;
      if (event === 'delete') db.__applyRemoteDelete(collection, payload);
      else db.__applyRemote(collection, payload);
    });
  }

  // 4. Flush anything queued from a previous offline session.
  if (typeof window !== 'undefined') {
    window.addEventListener('online', flushOnline);
  }
  await flush();
  if (queue.length === 0) setStatus('live');
}

function flushOnline() {
  retryMs = RETRY_BASE_MS;
  void flush();
}

export function stopSync() {
  db.__setMirror(null);
  if (unsubscribeRemote) unsubscribeRemote();
  unsubscribeRemote = null;
  clearTimeout(retryTimer);
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', flushOnline);
  }
  remote = null;
  setStatus('off');
}
