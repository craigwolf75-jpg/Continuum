import type { Injury } from './types';

export const CASE_TYPE_PSYCHOLOGICAL_INJURY = 'psychological_injury';

export function isPsychologicalInjury(injury: Injury | null | undefined): boolean {
  if (!injury) return false;
  if (injury.case_type === CASE_TYPE_PSYCHOLOGICAL_INJURY) return true;
  return false;
}
