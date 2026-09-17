import { Preferences } from '@capacitor/preferences';

const ACK_KEY = 'continuum_prompt61_duty_ack_v1';
const HOURS_KEY = 'continuum_prompt61_hours_v1';
const MSG_KEY = 'continuum_prompt61_messages_v1';
const DOC_KEY = 'continuum_prompt61_documents_v1';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const { value } = await Preferences.get({ key });
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export type DutyAckRecord = {
  date: string;
  duties_approved: string[];
  hours_approved: number | 'UNKNOWN' | null;
};

export type HoursRecord = {
  date: string;
  hours: number | null;
  source: 'worker_confirmation';
};

export type MessageRecord = {
  at: string;
  body: string;
};

export type DocumentRecord = {
  at: string;
  filename: string;
};

export async function saveDutyAck(record: DutyAckRecord): Promise<void> {
  const items = await readJson<DutyAckRecord[]>(ACK_KEY, []);
  const next = items.filter((r) => r.date !== record.date).concat([record]);
  await Preferences.set({ key: ACK_KEY, value: JSON.stringify(next) });
}

export async function dutyAckForDate(date: string): Promise<DutyAckRecord | null> {
  const items = await readJson<DutyAckRecord[]>(ACK_KEY, []);
  return items.find((r) => r.date === date) || null;
}

export async function saveHours(record: HoursRecord): Promise<void> {
  const items = await readJson<HoursRecord[]>(HOURS_KEY, []);
  const next = items.filter((r) => r.date !== record.date).concat([record]);
  await Preferences.set({ key: HOURS_KEY, value: JSON.stringify(next) });
}

export async function hoursForDate(date: string): Promise<HoursRecord | null> {
  const items = await readJson<HoursRecord[]>(HOURS_KEY, []);
  return items.find((r) => r.date === date) || null;
}

export async function saveMessage(record: MessageRecord): Promise<void> {
  const items = await readJson<MessageRecord[]>(MSG_KEY, []);
  items.push(record);
  await Preferences.set({ key: MSG_KEY, value: JSON.stringify(items) });
}

export async function listMessages(): Promise<MessageRecord[]> {
  return readJson<MessageRecord[]>(MSG_KEY, []);
}

export async function saveDocument(record: DocumentRecord): Promise<void> {
  const items = await readJson<DocumentRecord[]>(DOC_KEY, []);
  items.push(record);
  await Preferences.set({ key: DOC_KEY, value: JSON.stringify(items) });
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  return readJson<DocumentRecord[]>(DOC_KEY, []);
}
