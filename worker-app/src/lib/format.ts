import type { RecoveryLog } from './types';
export function dayOfPrognosis(dateOfInjury: string | null): number {
  if (!dateOfInjury) return 0;
  const start = new Date(dateOfInjury + 'T00:00:00Z').getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 86400000));
}
const LABELS: Record<string, string> = {
  reported: 'Reported', off_work: 'Off work', light_duty: 'Light duty',
  full_duty_pending: 'Return pending', signed_off: 'Signed off', escalated: 'Escalated'
};
export function statusLabel(status: string): string { return LABELS[status] ?? status; }
export function checkinWindow(logsToday: RecoveryLog[]): 'AM' | 'PM' | 'done' {
  if (logsToday.length >= 2) return 'done';
  if (logsToday.length === 1) return 'PM';
  return 'AM';
}
