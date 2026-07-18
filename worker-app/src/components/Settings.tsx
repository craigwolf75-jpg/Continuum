'use client';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';
import { signOut } from '@/lib/auth';

export default function Settings() {
  const { consent, refreshConsent } = useSession();
  async function revoke() {
    if (!consent) return;
    await supabase.from('consents').update({ revoked_at: new Date().toISOString() }).eq('id', consent.id);
    await refreshConsent();
  }
  return (
    <div className="space-y-4">
      <section className="bg-panel border border-line rounded-2xl p-5">
        <div className="text-gold font-head text-xs uppercase tracking-widest">Privacy center</div>
        <p className="mt-2 text-sm">Consent given {consent ? new Date(consent.granted_at).toLocaleDateString() : 'not yet'}. You can take it back any time; collection stops right away.</p>
        {consent && <button className="border border-line rounded-xl px-4 mt-3" onClick={revoke}>Revoke consent</button>}
      </section>
      <button className="w-full border border-line rounded-xl" onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
