/**
 * ReliefOS + DARK ZONE: Offline Queue Manager
 * Uses IndexedDB (via idb-keyval) to persist offline duties, verification actions, and reports.
 * Emits change events and automatically syncs upon browser 'online' event.
 */

import { get, set, del } from 'idb-keyval';

const QUEUE_KEY = 'reliefos_offline_sync_queue';
const listeners = new Set();

export function subscribeQueue(callback) {
  listeners.add(callback);
  // initial broadcast
  getPendingQueue().then(q => callback(q.length));
  return () => listeners.delete(callback);
}

function notifyListeners(count) {
  listeners.forEach(cb => {
    try { cb(count); } catch (e) { console.error(e); }
  });
}

/**
 * Returns array of queued offline actions
 */
export async function getPendingQueue() {
  try {
    const queue = await get(QUEUE_KEY);
    return Array.isArray(queue) ? queue : [];
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to memory/local', err);
    try {
      const fallback = localStorage.getItem(QUEUE_KEY);
      return fallback ? JSON.parse(fallback) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Enqueues a new user action while offline
 * @param {Object} item { type, payload, clientId, createdAt }
 */
export async function enqueueAction(item) {
  const queue = await getPendingQueue();
  const entry = {
    ...item,
    clientId: item.clientId || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: item.createdAt || new Date().toISOString(),
    retryCount: 0
  };
  
  queue.push(entry);
  
  try {
    await set(QUEUE_KEY, queue);
  } catch (err) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
  
  notifyListeners(queue.length);
  return entry;
}

/**
 * Removes successfully synchronized items
 */
export async function clearQueue() {
  try {
    await del(QUEUE_KEY);
  } catch (err) {
    localStorage.removeItem(QUEUE_KEY);
  }
  notifyListeners(0);
}

/**
 * Syncs all pending actions with the backend API
 * @param {Function} apiSyncFunction 
 */
export async function flushOfflineQueue(apiSyncFunction) {
  const queue = await getPendingQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  try {
    const result = await apiSyncFunction(queue);
    await clearQueue();
    return { processed: queue.length, failed: 0, result };
  } catch (err) {
    console.error('Queue flush failed, keeping items in IndexedDB:', err);
    return { processed: 0, failed: queue.length, error: err.message };
  }
}

// Setup automatic sync on browser online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[ReliefOS] Network online event detected. Auto-sync triggered.');
    window.dispatchEvent(new CustomEvent('reliefos:trigger-sync'));
  });
}
