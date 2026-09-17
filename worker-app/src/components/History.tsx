'use client';
import { useEffect, useState } from 'react';
import type { Prompt60CheckInRecord } from '@/lib/types';
import { listPrompt60Checkins } from '@/lib/prompt60_checkin_store';

export default function History() {
  const [rows, setRows] = useState<Prompt60CheckInRecord[]>([]);
  useEffect(() => {
    listPrompt60Checkins().then((data) => setRows(data || []));
  }, []);

  const chronological = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return (
    <div className="space-y-4">
      <section className="bg-panel border border-line rounded-2xl p-5">
        <h3 className="font-head font-semibold">Check-in record</h3>
        <p className="text-muted text-sm mt-1">A chronological list of what you reported. This is not a score.</p>
        {chronological.length === 0 ? (
          <p className="text-muted text-sm mt-3">No check-in is on file for this date.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {chronological.map((r) => (
              <li key={r.date + '-' + r.kind} className="border-b border-line pb-3 last:border-0">
                <div className="text-muted text-sm">{r.date}</div>
                {(r.provocation || []).map((p) => (
                  <div key={p.duty} className="text-sm mt-1">
                    {p.duty}: worsened {p.worsened}, settled within 24h {p.settled_within_24h}
                  </div>
                ))}
                {r.free_text ? <div className="text-sm mt-1">worker reported: {r.free_text}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
