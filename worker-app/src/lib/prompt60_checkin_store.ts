import { Preferences } from '@capacitor/preferences';
import type { Prompt60CheckInRecord, Prompt60FollowUp } from './types';

const KEY = 'continuum_prompt60_checkin_v1';
const DRAFT_KEY = 'continuum_prompt60_checkin_draft_v1';

export const SYNTH_CHECKIN_FIXTURE = [
  { duty_id: 'SYNTH-DUTY-0101', duty_name: 'Gatehouse monitoring', fixture: true as const },
  { duty_id: 'SYNTH-DUTY-0201', duty_name: 'Yard foot patrol', fixture: true as const },
  { duty_id: 'SYNTH-DUTY-0302', duty_name: 'Light bin sorting', fixture: true as const },
];

async function readList(): Promise<Prompt60CheckInRecord[]> {
  const { value } = await Preferences.get({ key: KEY });
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeList(items: Prompt60CheckInRecord[]): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(items) });
}

export async function listPrompt60Checkins(): Promise<Prompt60CheckInRecord[]> {
  return readList();
}

export async function savePrompt60Checkin(record: Prompt60CheckInRecord): Promise<void> {
  const items = await readList();
  const next = items.filter((r) => !(r.date === record.date && r.kind === record.kind));
  next.push(record);
  next.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  await writeList(next);
}

export async function checkinForDate(date: string): Promise<Prompt60CheckInRecord | null> {
  const items = await readList();
  return items.find((r) => r.date === date && r.kind === 'today') || null;
}

export async function openFollowUps(): Promise<Prompt60FollowUp[]> {
  const items = await readList();
  const out: Prompt60FollowUp[] = [];
  for (const r of items) {
    for (const p of r.provocation || []) {
      if (p.worsened !== 'yes') continue;
      const answered = r.follow_up_answers && r.follow_up_answers[p.duty];
      if (answered) continue;
      if (p.settled_within_24h === 'no' || p.settled_within_24h === 'unanswered' || r.settled_end_of_shift === 'no') {
        out.push({ duty: p.duty, from_date: r.date });
      }
    }
  }
  return out;
}

export async function saveDraft(draft: unknown): Promise<void> {
  await Preferences.set({ key: DRAFT_KEY, value: JSON.stringify(draft || {}) });
}

export async function loadDraft<T>(): Promise<T | null> {
  const { value } = await Preferences.get({ key: DRAFT_KEY });
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  await Preferences.remove({ key: DRAFT_KEY });
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}
