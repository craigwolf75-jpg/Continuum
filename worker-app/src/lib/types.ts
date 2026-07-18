export type Tenant = { id: string; name: string; branding: { display_name?: string; logo_url?: string | null; colors?: { navy?: string; gold?: string } } };
export type Injury = { id: string; tenant_id: string; worker_id: string; body_part: string | null; injury_type: string | null; status: string; prognosis_days: number | null; date_of_injury: string | null; estimated_return_date: string | null; current_restrictions: string | null };
export type WorkerProfile = { user_id: string; tenant_id: string | null; full_name: string | null; worker_id: string | null };
export type RecoveryLog = { id: string; injury_id: string; logged_at: string; pain_score: number | null; mobility_score: number | null; notes: string | null; source: string };
export type LightDuty = { id: string; injury_id: string; task_description: string | null; medical_restrictions: string | null; completed_date: string | null; worker_feedback: string | null };
export type Consent = { id: string; user_id: string; version: string; granted_at: string; revoked_at: string | null };
