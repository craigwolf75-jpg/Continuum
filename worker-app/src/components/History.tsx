'use client';
import { useEffect, useState } from 'react';
import type { Prompt60CheckInRecord, ProvocationRecord } from '@/lib/types';
import { listPrompt60Checkins } from '@/lib/prompt60_checkin_store';
import { useSession } from '@/state/SessionProvider';
import { isPsychologicalInjury } from '@/lib/prompt61_psych';
import { dutyAckForDate, hoursForDate } from '@/lib/prompt61_day_store';
import { todayIso } from '@/lib/prompt60_checkin_store';

function workerDutyLine(p: ProvocationRecord): string {
  if (p.worsened !== 'yes') {
    return p.duty + '. You said this duty did not make your symptoms worse.';
  }
  if (p.settled_within_24h === 'yes') {
    return p.duty + '. You said this duty made your symptoms worse. That has settled.';
  }
  if (p.settled_within_24h === 'no') {
    return p.duty + '. You said this duty made your symptoms worse. That has not settled.';
  }
  return p.duty + '. You said this duty made your symptoms worse. This follow up is still open. Save an answer when you can.';
}

export default function History() {
  const { injury } = useSession();
  const psych = isPsychologicalInjury(injury);
  const [rows, setRows] = useState<Prompt60CheckInRecord[]>([]);
  const [psychLine, setPsychLine] = useState<string>('');
  useEffect(() => {
    if (psych) {
      const date = todayIso();
      Promise.all([dutyAckForDate(date), hoursForDate(date)]).then(([ack, hrs]) => {
        const bits = [];
        if (ack) bits.push('Duty acknowledgment saved for ' + ack.date + '.');
        if (hrs && hrs.hours != null) bits.push('Hours confirmed: ' + hrs.hours + '.');
        setPsychLine(bits.join(' ') || 'No duty acknowledgment or hours confirmation is saved yet.');
      });
      return;
    }
    listPrompt60Checkins().then((data) => setRows(data || []));
  }, [psych]);

  const chronological = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return (
    <div className="space-y-4">
      <section className="bg-panel border border-line rounded-2xl p-5">
        <h3 className="font-head font-semibold">{psych ? 'Your work records' : 'Your check-ins'}</h3>
        <p className="text-muted text-sm mt-1">{psych ? 'Duty acknowledgments and hours only. There is no symptom record on this case.' : 'This list is what you reported. It is not a score.'}</p>
        {psych ? (
          <p className="text-sm mt-3">{psychLine}</p>
        ) : chronological.length === 0 ? (
          <p className="text-muted text-sm mt-3">You have not saved a check-in yet. You can save one from Today&apos;s duties.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {chronological.map((r) => (
              <li key={r.date + '-' + r.kind} className="border-b border-line pb-3 last:border-0">
                <div className="text-muted text-sm">{r.date}</div>
                {(r.provocation || []).map((p) => (
                  <div key={p.duty} className="text-sm mt-1">
                    {workerDutyLine(p)}
                  </div>
                ))}
                {r.free_text ? <div className="text-sm mt-1">You also said: {r.free_text}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
