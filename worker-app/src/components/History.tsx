'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';
import type { RecoveryLog } from '@/lib/types';

export default function History() {
  const { injury } = useSession();
  const [logs, setLogs] = useState<RecoveryLog[]>([]);
  useEffect(() => {
    if (!injury) return;
    supabase.from('recovery_logs').select('id, injury_id, logged_at, pain_score, mobility_score, notes, source').eq('injury_id', injury.id).order('logged_at', { ascending: true }).limit(16).then(({ data }) => setLogs((data as RecoveryLog[]) ?? []));
  }, [injury?.id]);

  const w = 340, h = 70, step = logs.length > 1 ? w / (logs.length - 1) : w;
  const y = (v: number | null) => h - ((v ?? 0) / 10) * h;
  const path = (key: 'pain_score' | 'mobility_score') => logs.map((p, i) => (i ? 'L' : 'M') + (i * step).toFixed(1) + ' ' + y(p[key]).toFixed(1)).join(' ');

  return (
    <div className="space-y-4">
      <section className="bg-panel border border-line rounded-2xl p-5">
        <div className="text-gold font-head text-xs uppercase tracking-widest">Your trend</div>
        <h3 className="font-head font-semibold mt-1 mb-2">Pain (gold) and movement (light)</h3>
        {logs.length ? (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" role="img" aria-label="Pain and movement trend">
            <path d={path('mobility_score')} fill="none" stroke="#9AA9BF" strokeWidth={2} />
            <path d={path('pain_score')} fill="none" stroke="#C8972F" strokeWidth={2.5} />
          </svg>
        ) : <p className="text-muted text-sm">No check-ins yet.</p>}
      </section>
      <section className="bg-panel border border-line rounded-2xl p-5">
        {[...logs].reverse().slice(0, 8).map(l => (
          <div key={l.id} className="flex justify-between border-b border-line py-2 text-sm last:border-0">
            <span className="text-muted">{new Date(l.logged_at).toLocaleString()}</span>
            <span>pain {l.pain_score} / move {l.mobility_score}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
