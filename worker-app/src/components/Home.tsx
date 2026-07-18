'use client';
import { useSession } from '@/state/SessionProvider';
import { dayOfPrognosis, statusLabel } from '@/lib/format';
import CheckIn from './CheckIn';

export default function Home() {
  const { injury } = useSession();
  if (!injury) return <p className="text-muted">No active injury on file.</p>;
  const day = dayOfPrognosis(injury.date_of_injury);
  return (
    <div className="space-y-4">
      <section className="bg-panel border border-line rounded-2xl p-5">
        <div className="text-gold font-head text-xs uppercase tracking-widest">Your recovery</div>
        <h1 className="font-head text-xl font-bold mt-1">{injury.body_part} injury</h1>
        <div className="flex gap-2 flex-wrap mt-3 text-xs">
          <span className="bg-chipbg border border-line rounded-full px-3 py-1">{statusLabel(injury.status)}</span>
          <span className="bg-chipbg border border-line rounded-full px-3 py-1">Day {day} of {injury.prognosis_days ?? '?'}</span>
          {injury.estimated_return_date && <span className="bg-chipbg border border-line rounded-full px-3 py-1">Back around {injury.estimated_return_date}</span>}
        </div>
        {injury.current_restrictions && <p className="text-muted text-sm mt-3">Work limit right now: {injury.current_restrictions}</p>}
      </section>
      {injury.status !== 'signed_off' && <CheckIn />}
    </div>
  );
}
