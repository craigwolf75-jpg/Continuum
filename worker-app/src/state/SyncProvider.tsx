'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { enqueue as qEnqueue, flush as qFlush, pendingCount, type Pending } from '@/lib/queue';

type Ctx = {
  online: boolean;
  pending: number;
  syncing: boolean;
  enqueue: (p: Pending) => Promise<void>;
  sync: () => Promise<void>;
};
const SyncCtx = createContext<Ctx | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refresh = useCallback(async () => {
    setPending(await pendingCount());
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await qFlush();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      await refresh();
    }
  }, [refresh]);

  const enqueue = useCallback(
    async (p: Pending) => {
      await qEnqueue(p);
      await refresh();
      void sync();
    },
    [refresh, sync]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOnline(navigator.onLine);
    void refresh();
    void sync();
    const on = () => {
      setOnline(true);
      void sync();
    };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [refresh, sync]);

  return <SyncCtx.Provider value={{ online, pending, syncing, enqueue, sync }}>{children}</SyncCtx.Provider>;
}

export function useSync(): Ctx {
  const c = useContext(SyncCtx);
  if (!c) throw new Error('useSync outside provider');
  return c;
}
