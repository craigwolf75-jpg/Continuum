export type Tenant = { id: string; name: string; branding: { display_name?: string; logo_url?: string | null; colors?: { navy?: string; gold?: string } } };
export type Injury = { id: string; tenant_id: string; worker_id: string; body_part: string | null; injury_type: string | null; case_type?: string | null; status: string; prognosis_days: number | null; date_of_injury: string | null; estimated_return_date: string | null; current_restrictions: string | null };
export type WorkerProfile = { user_id: string; tenant_id: string | null; full_name: string | null; worker_id: string | null };
export type RecoveryLog = { id: string; injury_id: string; logged_at: string; pain_score: number | null; mobility_score: number | null; notes: string | null; source: string };
export type ProvocationRecord = {
  duty: string;
  date: string;
  worsened: 'yes' | 'no';
  settled_within_24h: 'yes' | 'no' | 'unanswered';
};
export type Prompt60FollowUp = { duty: string; from_date: string };
export type Prompt60CheckInRecord = {
  kind: 'today' | 'follow_up';
  date: string;
  duties_performed: string[];
  worsened_duties: string[];
  settled_end_of_shift: 'yes' | 'no' | null;
  approved_hours: number | 'UNKNOWN' | null;
  hours_worked: number | null;
  free_text: string | null;
  provocation: ProvocationRecord[];
  follow_up_answers?: Record<string, 'yes' | 'no'>;
  fixture: true;
};
export type LightDuty = { id: string; injury_id: string; task_description: string | null; medical_restrictions: string | null; completed_date: string | null; worker_feedback: string | null };
export type Consent = { id: string; user_id: string; version: string; granted_at: string; revoked_at: string | null };
