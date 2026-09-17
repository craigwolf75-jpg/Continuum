'use client';
import { useEffect, useState } from 'react';
import { useSession } from '@/state/SessionProvider';
import { todayIso } from '@/lib/prompt60_checkin_store';
import {
  dutyAckForDate,
  hoursForDate,
  listDocuments,
  listMessages,
  saveDocument,
  saveDutyAck,
  saveHours,
  saveMessage,
} from '@/lib/prompt61_day_store';
import SupportLink from './SupportLink';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';
const APPROVED = [
  { id: 'SYNTH-DUTY-0103', name: 'Visitor log entry' },
  { id: 'SYNTH-DUTY-0302', name: 'Light bin sorting' },
];

export default function PsychDay() {
  const { injury } = useSession();
  const date = todayIso();
  const [acked, setAcked] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [hours, setHours] = useState('');
  const [hoursSaved, setHoursSaved] = useState(false);
  const [note, setNote] = useState('');
  const [msgCount, setMsgCount] = useState(0);
  const [docName, setDocName] = useState('');
  const [docCount, setDocCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ack = await dutyAckForDate(date);
      const hrs = await hoursForDate(date);
      const msgs = await listMessages();
      const docs = await listDocuments();
      if (cancelled) return;
      setAcked(Boolean(ack));
      if (ack) setPicked(ack.duties_approved);
      setHoursSaved(Boolean(hrs));
      if (hrs && hrs.hours != null) setHours(String(hrs.hours));
      setMsgCount(msgs.length);
      setDocCount(docs.length);
    })();
    return () => { cancelled = true; };
  }, [date]);

  async function persistAck() {
    try {
      await saveDutyAck({ date, duties_approved: picked, hours_approved: 'UNKNOWN' });
      setAcked(true);
      setStatus('saved');
    } catch {
      setStatus('failed');
    }
  }

  async function persistHours() {
    try {
      await saveHours({ date, hours: hours === '' ? null : Number(hours), source: 'worker_confirmation' });
      setHoursSaved(true);
      setStatus('saved');
    } catch {
      setStatus('failed');
    }
  }

  async function persistMessage() {
    if (!note.trim()) return;
    try {
      await saveMessage({ at: new Date().toISOString(), body: note.trim() });
      setNote('');
      setMsgCount((n) => n + 1);
      setStatus('saved');
    } catch {
      setStatus('failed');
    }
  }

  async function persistDoc() {
    if (!docName.trim()) return;
    try {
      await saveDocument({ at: new Date().toISOString(), filename: docName.trim() });
      setDocName('');
      setDocCount((n) => n + 1);
      setStatus('saved');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-panel border border-line rounded-2xl p-5">
        <h3 className="font-head font-semibold">Today&apos;s duties</h3>
        <p className="text-muted text-sm mt-2">Confirm the duties and hours you are approved for today. This is a work instruction, not a health question.</p>
        {injury?.current_restrictions ? <p className="text-sm mt-2">Approved limits: {injury.current_restrictions}</p> : null}
        <ul className="mt-3 space-y-2">
          {APPROVED.map((d) => (
            <li key={d.id}>
              <label className="flex items-center gap-3 min-h-12 w-full">
                <input
                  type="checkbox"
                  className={'h-5 w-5 shrink-0 accent-gold ' + FOCUS}
                  checked={picked.includes(d.name)}
                  onChange={() => {
                    const on = picked.includes(d.name);
                    setPicked(on ? picked.filter((n) => n !== d.name) : [...picked, d.name]);
                  }}
                />
                <span>{d.name}</span>
              </label>
            </li>
          ))}
        </ul>
        <button className={'w-full min-h-12 bg-gold text-navy font-semibold rounded-xl mt-3 p-3 ' + FOCUS} disabled={acked} onClick={persistAck}>
          {acked ? 'Acknowledged today' : 'I understand today\'s duties and hours'}
        </button>
      </section>

      <section className="bg-panel border border-line rounded-2xl p-5">
        <h3 className="font-head font-semibold">Hours today</h3>
        <p className="text-muted text-sm mt-2">Type the hours you actually worked. This is not a health record.</p>
        <label className="block font-semibold mt-3" htmlFor="psych-hours">Hours you worked today</label>
        <input id="psych-hours" type="number" min={0} step="0.25" className={'w-full min-h-12 bg-chipbg border border-line rounded-xl p-3 mt-2 text-ink ' + FOCUS} value={hours} onChange={(e) => setHours(e.target.value)} />
        <button className={'w-full min-h-12 bg-gold text-navy font-semibold rounded-xl mt-3 p-3 ' + FOCUS} disabled={hoursSaved} onClick={persistHours}>
          {hoursSaved ? 'Hours saved' : 'Save hours'}
        </button>
      </section>

      <section className="bg-panel border border-line rounded-2xl p-5">
        <h3 className="font-head font-semibold">Message your coordinator</h3>
        <p className="text-muted text-sm mt-2">Secure. Your employer does not see this thread.</p>
        <textarea id="psych-msg" className={'w-full min-h-24 bg-chipbg border border-line rounded-xl p-3 mt-2 text-ink ' + FOCUS} value={note} onChange={(e) => setNote(e.target.value)} />
        <button className={'w-full min-h-12 bg-gold text-navy font-semibold rounded-xl mt-3 p-3 ' + FOCUS} onClick={persistMessage}>Send message</button>
        <p className="text-muted text-sm mt-2">{msgCount} saved on this device.</p>
      </section>

      <section className="bg-panel border border-line rounded-2xl p-5">
        <h3 className="font-head font-semibold">Upload a document</h3>
        <p className="text-muted text-sm mt-2">A letter or form your coordinator asked for.</p>
        <label className="block font-semibold mt-3" htmlFor="psych-doc">File name</label>
        <input id="psych-doc" className={'w-full min-h-12 bg-chipbg border border-line rounded-xl p-3 mt-2 text-ink ' + FOCUS} value={docName} onChange={(e) => setDocName(e.target.value)} />
        <button className={'w-full min-h-12 bg-gold text-navy font-semibold rounded-xl mt-3 p-3 ' + FOCUS} onClick={persistDoc}>Save document name</button>
        <p className="text-muted text-sm mt-2">{docCount} saved on this device.</p>
      </section>

      <SupportLink />
      {status === 'failed' && <p className="text-muted text-sm">Not saved yet. Try again in a few minutes.</p>}
    </div>
  );
}
