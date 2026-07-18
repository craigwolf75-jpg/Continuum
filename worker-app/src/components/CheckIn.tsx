'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';
import { useSync } from '@/state/SyncProvider';

function todayRange() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

export default function CheckIn() {
  const { injury } = useSession();
  const { enqueue, online } = useSync();
  const [pain, setPain] = useState(3);
  const [mob, setMob] = useState(6);
  const [notes, setNotes] = useState('');
  const [submittedToday, setSubmittedToday] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!injury) return;
    supabase
      .from('recovery_logs')
      .select('id')
      .eq('injury_id', injury.id)
      .gte('logged_at', todayRange())
      .then(({ data }) => setSubmittedToday((data as unknown[])?.length ?? 0));
  }, [injury?.id]);

  // AM window, then PM, then done. Counts locally submitted check-ins so the
  // window advances even while offline (before the row reaches the server).
  const slot = submittedToday >= 2 ? 'done' : submittedToday === 1 ? 'PM' : 'AM';

  async function submit() {
    if (!injury || slot === 'done' || busy) return;
    setBusy(true);
    await enqueue({
      kind: 'checkin',
      client_generated_id: crypto.randomUUID(),
      tenant_id: injury.tenant_id,
      injury_id: injury.id,
      pain_score: pain,
      mobility_score: mob,
      notes: notes || null,
    });
    setNotes('');
    setSubmittedToday((n) => n + 1);
    setBusy(false);
  }

  if (slot === 'done')
    return (
      <section className="bg-panel border border-line rounded-2xl p-5">
        <h3 className="font-head font-semibold">Both check-ins done today</h3>
        <p className="text-muted text-sm">See you tomorrow.</p>
      </section>
    );

  return (
    <section className="bg-panel border border-line rounded-2xl p-5">
      <div className="text-gold font-head text-xs uppercase tracking-widest">{slot} check-in</div>
      <label className="flex justify-between font-semibold mt-3">
        How is your pain? <span className="text-gold font-head">{pain}</span>
      </label>
      <input type="range" min={0} max={10} value={pain} onChange={(e) => setPain(+e.target.value)} className="w-full accent-gold" />
      <label className="flex justify-between font-semibold mt-3">
        How is your movement? <span className="text-gold font-head">{mob}</span>
      </label>
      <input type="range" min={0} max={10} value={mob} onChange={(e) => setMob(+e.target.value)} className="w-full accent-gold" />
      <textarea className="w-full bg-chipbg border border-line rounded-xl p-3 mt-3 text-ink" placeholder="Anything you want your clinician to know? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button className="w-full bg-gold text-navy font-semibold rounded-xl mt-3" disabled={busy} onClick={submit}>
        Save check-in
      </button>
      <p className="text-muted text-xs mt-2">
        {online ? 'Only your clinician sees your scores and notes.' : 'You are offline. This saves and sends when you reconnect.'}
      </p>
    </section>
  );
}
