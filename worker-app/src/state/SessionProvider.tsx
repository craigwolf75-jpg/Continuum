'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { WorkerProfile, Injury, Consent, Tenant } from '@/lib/types';

type Ctx = { session: Session | null; profile: WorkerProfile | null; injury: Injury | null; consent: Consent | null; tenant: Tenant | null; loading: boolean; refreshConsent: () => Promise<void>; refreshInjury: () => Promise<void>; };
const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [injury, setInjury] = useState<Injury | null>(null);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: u } = await supabase.from('users').select('id, tenant_id, full_name').limit(1).maybeSingle();
    if (!u) { setProfile(null); return; }
    const { data: w } = await supabase.from('workers').select('id').eq('user_id', u.id).maybeSingle();
    setProfile({ user_id: u.id, tenant_id: u.tenant_id, full_name: u.full_name, worker_id: w?.id ?? null });
    if (u.tenant_id) {
      const { data: t } = await supabase.from('tenants').select('id, name, branding').eq('id', u.tenant_id).maybeSingle();
      setTenant(t as Tenant | null);
    }
  }, []);
  const refreshInjury = useCallback(async () => {
    const { data } = await supabase.from('injuries').select('id, tenant_id, worker_id, body_part, injury_type, status, prognosis_days, date_of_injury, estimated_return_date, current_restrictions').is('deleted_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
    setInjury(data as Injury | null);
  }, []);
  const refreshConsent = useCallback(async () => {
    const { data } = await supabase.from('consents').select('id, user_id, version, granted_at, revoked_at').is('deleted_at', null).is('revoked_at', null).order('granted_at', { ascending: false }).limit(1).maybeSingle();
    setConsent(data as Consent | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    (async () => {
      if (!session) { setProfile(null); setInjury(null); setConsent(null); setTenant(null); setLoading(false); return; }
      setLoading(true);
      await loadProfile(); await refreshInjury(); await refreshConsent();
      setLoading(false);
    })();
  }, [session, loadProfile, refreshInjury, refreshConsent]);

  return <SessionCtx.Provider value={{ session, profile, injury, consent, tenant, loading, refreshConsent, refreshInjury }}>{children}</SessionCtx.Provider>;
}
export function useSession(): Ctx { const c = useContext(SessionCtx); if (!c) throw new Error('useSession outside provider'); return c; }
