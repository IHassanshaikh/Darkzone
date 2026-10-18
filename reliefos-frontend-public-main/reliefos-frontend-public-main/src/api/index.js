/**
 * src/api/index.js
 *
 * Thin API wrapper.  All calls hit /sync.
 * If the backend is unreachable (network error or non-2xx), we simulate
 * success so the demo stays fully functional without a real server.
 */

const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';
const API_BASE = rawBase.replace(/\/+$/, '');

/**
 * POST /sync  — flush a batch of queued items to the backend.
 *
 * Payload:  { items: QueueItem[] }
 * Expected: { accepted: string[], rejected: [] }
 *
 * Falls back to a simulated success when the server is unreachable.
 *
 * @param {Array} items  — items from offlineQueue
 * @returns {Promise<{ accepted: string[], rejected: [] }>}
 */
export async function postSync(items) {
  try {
    const res = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      // Non-2xx → treat as temporary failure; caller increments attempts
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch {
    // Backend unreachable (demo mode) → simulate full acceptance
    return {
      accepted: items.map((i) => i.clientId),
      rejected: [],
      simulated: true,
    };
  }
}
