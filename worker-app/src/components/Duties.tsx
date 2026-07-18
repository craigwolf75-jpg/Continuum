'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/SessionProvider';
import { useSync } from '@/state/SyncProvider';
import type { LightDuty } from '@/lib/types';

export default function Duties() {
  const { injury } = useSession();
  const { enqueue } = useSync();
  const [duties, setDuties] = useState<LightDuty[]>([]);
  async function load() {
    if (!injury) return;
    const { data } = await supabase.from('light_duties').select('id, injury_id, task_description, medical_restrictions, completed_date, worker_feedback').eq('injury_id', injury.id).is('deleted_at', null).order('created_at', { ascending: true });
    setDuties((data as LightDuty[]) ?? []);
  }
  useEffect(() => { load(); }, [injury?.id]);

  async function toggle(d: LightDuty) {
    const completed = !d.completed_date;
    // optimistic local update, then queue for sync (works offline)
    setDuties((ds) => ds.map((x) => (x.id === d.id ? { ...x, completed_date: completed ? new Date().toISOString().slice(0, 10) : null } : x)));
    await enqueue({ kind: 'duty', id: d.id, completed });
  }

  if (injury && injury.status !== 'light_duty') return <p className="text-muted">No duties right now. Your site assigns these once your clinician clears you for light duty.</p>;
  return (
    <div className="space-y-4">
      {injury?.current_restrictions && (
        <section className="bg-panel border border-line rounded-2xl p-4">
          <div className="text-gold font-head text-xs uppercase tracking-widest">Your limit</div>
          <p className="mt-1">{injury.current_restrictions}</p>
        </section>
      )}
      <section className="bg-panel border border-line rounded-2xl p-4">
        {duties.length ? duties.map(d => (
          <div key={d.id} className="flex justify-between items-center border-b border-line py-3 last:border-0">
            <span className={d.completed_date ? 'line-through text-muted' : ''}>{d.task_description}</span>
            <button className="border border-line rounded-lg px-3 text-sm" onClick={() => toggle(d)}>{d.completed_date ? 'Undo' : 'Done'}</button>
          </div>
        )) : <p className="text-muted text-sm">No duties assigned yet.</p>}
      </section>
    </div>
  );
}
