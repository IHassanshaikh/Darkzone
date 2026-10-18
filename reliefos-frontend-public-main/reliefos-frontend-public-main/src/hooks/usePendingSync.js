/**
 * src/hooks/usePendingSync.js
 *
 * React hook that returns the live pending-sync count and a flush function.
 * Subscribes to offlineQueue via subscribeToQueue() so it reacts without polling.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getPendingCount,
  subscribeToQueue,
  flushQueue,
} from '../lib/offlineQueue.js';

export function usePendingSync() {
  const [pendingCount, setPendingCount] = useState(0);

  // Load initial count and subscribe to changes
  useEffect(() => {
    let mounted = true;

    getPendingCount().then((n) => {
      if (mounted) setPendingCount(n);
    });

    const unsub = subscribeToQueue((n) => {
      if (mounted) setPendingCount(n);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const flush = useCallback(async () => {
    await flushQueue();
    const n = await getPendingCount();
    setPendingCount(n);
  }, []);

  return { pendingCount, flush };
}
