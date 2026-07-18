import { Preferences } from '@capacitor/preferences';
import { supabase } from './supabase';

// Offline-first queue. Check-ins and duty check-offs are written here first,
// then flushed to Supabase when online. Idempotency: a check-in carries a
// client_generated_id, and recovery_logs has a UNIQUE constraint on it, so a
// retried flush that already landed comes back as a duplicate (Postgres 23505)
// and is treated as success. Storage is Capacitor Preferences, which uses
// localStorage on web and native storage on device.

const KEY = 'continuum_pending_v1';

export type Pending =
  | {
      kind: 'checkin';
      client_generated_id: string;
      tenant_id: string;
      injury_id: string;
      pain_score: number;
      mobility_score: number;
      notes: string | null;
    }
  | { kind: 'duty'; id: string; completed: boolean };

async function read(): Promise<Pending[]> {
  const { value } = await Preferences.get({ key: KEY });
  if (!value) return [];
  try {
    return JSON.parse(value) as Pending[];
  } catch {
    return [];
  }
}
async function write(items: Pending[]): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(items) });
}

export async function enqueue(item: Pending): Promise<void> {
  const items = await read();
  items.push(item);
  await write(items);
}

export async function pendingCount(): Promise<number> {
  return (await read()).length;
}

// Try to push every queued item. Items that fail (offline, transient error)
// stay queued; items that succeed or come back as idempotent duplicates are
// removed. Returns how many synced and how many remain.
export async function flush(): Promise<{ synced: number; remaining: number }> {
  const items = await read();
  if (items.length === 0) return { synced: 0, remaining: 0 };
  const keep: Pending[] = [];
  let synced = 0;
  for (const it of items) {
    try {
      if (it.kind === 'checkin') {
        const { error } = await supabase.from('recovery_logs').insert({
          tenant_id: it.tenant_id,
          injury_id: it.injury_id,
          client_generated_id: it.client_generated_id,
          pain_score: it.pain_score,
          mobility_score: it.mobility_score,
          notes: it.notes,
          source: 'check_in',
        });
        if (error && error.code !== '23505') {
          keep.push(it);
          continue;
        }
        synced++;
      } else {
        const { error } = await supabase
          .from('light_duties')
          .update({ completed_date: it.completed ? new Date().toISOString().slice(0, 10) : null })
          .eq('id', it.id);
        if (error) {
          keep.push(it);
          continue;
        }
        synced++;
      }
    } catch {
      keep.push(it);
    }
  }
  await write(keep);
  return { synced, remaining: keep.length };
}
