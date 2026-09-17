import { Preferences } from '@capacitor/preferences';
import { supabase } from './supabase';
import { savePrompt60Checkin } from './prompt60_checkin_store';
import type { Prompt60CheckInRecord } from './types';

// Offline-first queue. Prompt 60 check-ins persist locally (Preferences).
// There is no live provocation table on this draft, so flush keeps the
// task-linked payload local and does not insert scored recovery rows.
// Duty check-offs still flush to light_duties. Storage is Capacitor
// Preferences. No dashes anywhere.

const KEY = 'continuum_pending_v1';

export type Pending =
  | {
      kind: 'checkin';
      client_generated_id: string;
      tenant_id: string;
      injury_id: string;
      provocation: Prompt60CheckInRecord;
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

// Try to push every queued item. Check-ins stay local: persist the
// provocation payload and do not write scores. Duty items still hit
// light_duties. Items that fail stay queued.
export async function flush(): Promise<{ synced: number; remaining: number }> {
  const items = await read();
  if (items.length === 0) return { synced: 0, remaining: 0 };
  const keep: Pending[] = [];
  let synced = 0;
  for (const it of items) {
    try {
      if (it.kind === 'checkin') {
        await savePrompt60Checkin(it.provocation);
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
