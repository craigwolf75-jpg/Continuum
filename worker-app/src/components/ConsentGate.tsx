'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';

export default function ConsentGate() {
  const { profile, tenant, refreshConsent } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agree() {
    if (!profile) return;
    setBusy(true); setError(null);
    const { error } = await supabase.from('consents').insert({
      tenant_id: tenant?.id ?? profile.tenant_id,
      user_id: profile.user_id,
      version: 'v1',
      scope: { employer: 'functional_status_only', clinician: 'full_detail', wcb: 'legal_milestones' }
    });
    if (error) { setError('Could not save your choice. Please try again.'); setBusy(false); return; }
    await refreshConsent();
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto">
      <div className="text-gold font-head text-xs uppercase tracking-widest">Before we start</div>
      <h1 className="font-head text-2xl font-bold mt-2 mb-4">Your privacy, in plain words</h1>
      <ul className="space-y-3 text-[15px]">
        <li><b>Your employer</b> sees what you can do at work. Never your medical details, pain scores, or notes.</li>
        <li><b>Your clinician</b> sees everything, so they can help you recover.</li>
        <li><b>WCB</b> receives the required paperwork at three points in your claim.</li>
        <li><b>Continuum</b> manages this information for you. It is not your medical record.</li>
      </ul>
      <p className="text-muted text-sm mt-4">You can change your mind any time in Settings. Saying no stops all collection. Read the full <a className="text-goldsoft" href="/privacy">Privacy Policy</a> and <a className="text-goldsoft" href="/terms">Terms of Service</a>.</p>
      <button className="w-full bg-gold text-navy font-semibold rounded-xl mt-6" disabled={busy} onClick={agree}>I agree, let us go</button>
      {error && <p className="text-goldsoft mt-3 text-sm">{error}</p>}
    </main>
  );
}
