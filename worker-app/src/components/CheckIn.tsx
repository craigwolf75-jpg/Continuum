'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';
import { checkinWindow } from '@/lib/format';
import type { RecoveryLog } from '@/lib/types';

function todayRange() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

export default function CheckIn() {
  const { injury } = useSession();
  const [pain, setPain] = useState(3);
  const [mob, setMob] = useState(6);
  const [notes, setNotes] = useState('');
  const [todayLogs, setTodayLogs] = useState<RecoveryLog[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadToday() {
    if (!injury) return;
    const { data } = await supabase.from('recovery_logs').select('id, injury_id, logged_at, pain_score, mobility_score, notes, source').eq('injury_id', injury.id).gte('logged_at', todayRange()).order('logged_at', { ascending: true });
    setTodayLogs((data as RecoveryLog[]) ?? []);
  }
  useEffect(() => { loadToday(); }, [injury?.id]);

  const window = checkinWindow(todayLogs);
  async function submit() {
    if (!injury || window === 'done') return;
    setBusy(true); setError(null);
    const { error } = await supabase.from('recovery_logs').insert({
      tenant_id: injury.tenant_id, injury_id: injury.id, client_generated_id: crypto.randomUUID(),
      pain_score: pain, mobility_score: mob, notes: notes || null, source: 'check_in'
    });
    if (error) {
      setError(error.message.includes('CONTINUUM_NO_CONSENT') ? 'Check-ins are paused because consent was turned off.' : 'Could not save your check-in.');
      setBusy(false); return;
    }
    setNotes(''); await loadToday(); setBusy(false);
  }

  if (window === 'done') return <section className="bg-panel border border-line rounded-2xl p-5"><h3 className="font-head font-semibold">Both check-ins done today</h3><p className="text-muted text-sm">See you tomorrow.</p></section>;

  return (
    <section className="bg-panel border border-line rounded-2xl p-5">
      <div className="text-gold font-head text-xs uppercase tracking-widest">{window} check-in</div>
      <label className="flex justify-between font-semibold mt-3">How is your pain? <span className="text-gold font-head">{pain}</span></label>
      <input type="range" min={0} max={10} value={pain} onChange={e => setPain(+e.target.value)} className="w-full accent-gold" />
      <label className="flex justify-between font-semibold mt-3">How is your movement? <span className="text-gold font-head">{mob}</span></label>
      <input type="range" min={0} max={10} value={mob} onChange={e => setMob(+e.target.value)} className="w-full accent-gold" />
      <textarea className="w-full bg-chipbg border border-line rounded-xl p-3 mt-3 text-ink" placeholder="Anything you want your clinician to know? (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
      <button className="w-full bg-gold text-navy font-semibold rounded-xl mt-3" disabled={busy} onClick={submit}>Save check-in</button>
      <p className="text-muted text-xs mt-2">Only your clinician sees your scores and notes.</p>
      {error && <p className="text-goldsoft mt-2 text-sm">{error}</p>}
    </section>
  );
}
