/**
 * src/lib/offlineQueue.js
 *
 * Offline-first queue backed by IndexedDB (via idb-keyval).
 * ──────────────────────────────────────────────────────────
 * • Items are persisted as { clientId, type, payload, createdAt, attempts }.
 * • Auto-flush fires on the browser 'online' event.
 * • Flush can also be triggered manually (e.g., "Sync now" button).
 * • Accepted items are removed; failed items stay queued with attempts + 1.
 * • When the backend is unreachable, postSync() simulates success → demo works.
 *
 * Item types (strings):
 *   'report'       — new sitrep submitted from AreaDetail
 *   'duty_status'  — volunteer advancing a duty status step
 */

import { get, set, del, keys } from 'idb-keyval';
import { postSync } from '../api/index.js';

// IndexedDB key prefix for queue items
const KEY_PREFIX = 'ofq_';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeKey(clientId) {
  return `${KEY_PREFIX}${clientId}`;
}

/** Return all queued items, sorted oldest-first. */
export async function getQueue() {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((k) => String(k).startsWith(KEY_PREFIX));
  const items = await Promise.all(queueKeys.map((k) => get(k)));
  // Filter out any undefined slots (race condition guard)
  return items
    .filter(Boolean)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/** Count pending items (used for the badge). */
export async function getPendingCount() {
  const items = await getQueue();
  return items.length;
}

/**
 * Enqueue one item.
 * @param {string} type   — 'report' | 'duty_status'
 * @param {object} payload — arbitrary data for the item
 * @returns {Promise<object>} the stored item
 */
export async function enqueue(type, payload) {
  const clientId = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item = {
    clientId,
    type,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await set(makeKey(clientId), item);
  return item;
}

/**
 * Remove a single item from the queue by clientId.
 * @param {string} clientId
 */
export async function dequeue(clientId) {
  await del(makeKey(clientId));
}

// ─── Flush ───────────────────────────────────────────────────────────────────

// External listener registry — components subscribe to know when count changes.
const _listeners = new Set();

export function subscribeToQueue(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function _notify() {
  getPendingCount().then((n) => _listeners.forEach((fn) => fn(n)));
}

/**
 * Flush the queue to the backend.
 * Accepted items are removed; failed items have attempts incremented.
 * @returns {Promise<{ flushed: number, remaining: number }>}
 */
export async function flushQueue() {
  const items = await getQueue();
  if (items.length === 0) return { flushed: 0, remaining: 0 };

  let result;
  try {
    result = await postSync(items);
  } catch {
    // If postSync itself throws (shouldn't — it catches internally), skip
    return { flushed: 0, remaining: items.length };
  }

  const accepted = new Set(result.accepted || []);

  await Promise.all(
    items.map(async (item) => {
      if (accepted.has(item.clientId)) {
        await dequeue(item.clientId);
      } else {
        // Increment attempts; keep in queue for next flush
        await set(makeKey(item.clientId), {
          ...item,
          attempts: item.attempts + 1,
        });
      }
    })
  );

  _notify();

  const remaining = await getPendingCount();
  return { flushed: accepted.size, remaining };
}

// ─── Auto-flush on 'online' ───────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushQueue().catch(() => {});
  });
}
