'use client';
import { useEffect, useState } from 'react';
import { useSession } from '@/state/SessionProvider';
import { useSync } from '@/state/SyncProvider';
import type { Prompt60CheckInRecord, Prompt60FollowUp, ProvocationRecord } from '@/lib/types';
import {
  SYNTH_CHECKIN_FIXTURE,
  checkinForDate,
  clearDraft,
  loadDraft,
  openFollowUps,
  saveDraft,
  savePrompt60Checkin,
  todayIso,
} from '@/lib/prompt60_checkin_store';

type Draft = {
  performed: string[];
  worse: '' | 'yes' | 'no';
  worseDuties: string[];
  settled: '' | 'yes' | 'no';
  hoursWorked: string;
  freeText: string;
};

const EMPTY: Draft = { performed: [], worse: '', worseDuties: [], settled: '', hoursWorked: '', freeText: '' };

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';
const MOTION = 'motion-safe:duration-200 motion-safe:transition-colors';

function choiceClass(pressed: boolean) {
  return (
    'min-h-12 w-full rounded-xl border p-3 text-left ' + MOTION + ' ' + FOCUS + ' ' +
    (pressed ? 'border-gold bg-chipbg font-semibold' : 'border-line')
  );
}

function buildProvocation(date: string, draft: Draft): ProvocationRecord[] {
  const worseSet = new Set(draft.worse === 'yes' ? draft.worseDuties : []);
  return draft.performed.map((duty) => {
    const worsened = worseSet.has(duty) ? 'yes' : 'no';
    let settled_within_24h: ProvocationRecord['settled_within_24h'] = 'yes';
    if (worsened === 'yes') {
      if (draft.settled === 'yes') settled_within_24h = 'yes';
      else if (draft.settled === 'no') settled_within_24h = 'no';
      else settled_within_24h = 'unanswered';
    }
    return { duty, date, worsened, settled_within_24h };
  });
}

export default function CheckIn() {
  const { injury } = useSession();
  const { enqueue, online } = useSync();
  const [ready, setReady] = useState(false);
  const [savedToday, setSavedToday] = useState(false);
  const [followUps, setFollowUps] = useState<Prompt60FollowUp[]>([]);
  const [followIndex, setFollowIndex] = useState(0);
  const [followAnswer, setFollowAnswer] = useState<'' | 'yes' | 'no'>('');
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'saved' | 'failed' | 'kept'>('idle');
  const [busy, setBusy] = useState(false);
  const date = todayIso();
  const duties = SYNTH_CHECKIN_FIXTURE;
  const approvedHours: number | 'UNKNOWN' = 'UNKNOWN';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const live = await checkinForDate(date);
      const cached = await loadDraft<Draft>();
      const pending = await openFollowUps();
      if (cancelled) return;
      setSavedToday(Boolean(live));
      if (!live && cached) setDraft({ ...EMPTY, ...cached });
      setFollowUps(pending);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [date]);

  async function persistToday() {
    if (!injury || busy) return;
    setBusy(true);
    try {
      const provocation = buildProvocation(date, draft);
      const record: Prompt60CheckInRecord = {
        kind: 'today',
        date,
        duties_performed: draft.performed,
        worsened_duties: draft.worse === 'yes' ? draft.worseDuties : [],
        settled_end_of_shift: draft.worse === 'yes' ? (draft.settled === 'yes' ? 'yes' : draft.settled === 'no' ? 'no' : null) : null,
        approved_hours: approvedHours,
        hours_worked: draft.hoursWorked === '' ? null : Number(draft.hoursWorked),
        free_text: draft.freeText.trim() ? draft.freeText : null,
        provocation,
        fixture: true,
      };
      await savePrompt60Checkin(record);
      await enqueue({
        kind: 'checkin',
        client_generated_id: crypto.randomUUID(),
        tenant_id: injury.tenant_id,
        injury_id: injury.id,
        provocation: record,
        notes: record.free_text,
      });
      await clearDraft();
      setSavedToday(true);
      setStatus('saved');
    } catch {
      setStatus('failed');
    } finally {
      setBusy(false);
    }
  }

  async function keepLater() {
    await saveDraft(draft);
    setStatus('kept');
  }

  async function persistFollowUp() {
    if (!injury || busy || !followAnswer || !followUps[followIndex]) return;
    setBusy(true);
    try {
      const item = followUps[followIndex];
      const existing = await checkinForDate(item.from_date);
      if (existing) {
        const next: Prompt60CheckInRecord = {
          ...existing,
          follow_up_answers: { ...(existing.follow_up_answers || {}), [item.duty]: followAnswer },
          provocation: (existing.provocation || []).map((p) =>
            p.duty === item.duty ? { ...p, settled_within_24h: followAnswer } : p
          ),
        };
        await savePrompt60Checkin(next);
        await enqueue({
          kind: 'checkin',
          client_generated_id: crypto.randomUUID(),
          tenant_id: injury.tenant_id,
          injury_id: injury.id,
          provocation: next,
          notes: null,
        });
      }
      const remaining = followUps.filter((_, i) => i !== followIndex);
      setFollowUps(remaining);
      setFollowIndex(0);
      setFollowAnswer('');
      setStatus('saved');
    } catch {
      setStatus('failed');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  if (followUps.length > 0) {
    const item = followUps[followIndex];
    const question = 'Yesterday you said ' + item.duty + ' made your symptoms worse. Has that now settled?';
    return (
      <section className="bg-panel border border-line rounded-2xl p-5">
        <h3 className="font-head font-semibold">About yesterday</h3>
        <p className="font-semibold mt-3">{question}</p>
        <p className="text-muted text-sm mt-2">Settled means you feel the same as before that duty.</p>
        <div className="flex flex-col gap-2 mt-3">
          <button type="button" className={choiceClass(followAnswer === 'yes')} aria-pressed={followAnswer === 'yes'} onClick={() => setFollowAnswer('yes')}>Yes, it has settled</button>
          <button type="button" className={choiceClass(followAnswer === 'no')} aria-pressed={followAnswer === 'no'} onClick={() => setFollowAnswer('no')}>No, it has not settled</button>
        </div>
        <button className={'w-full min-h-12 bg-gold text-navy font-semibold rounded-xl mt-3 p-3 ' + FOCUS} disabled={busy || !followAnswer} onClick={persistFollowUp}>Save check-in</button>
        {status === 'saved' && <p className="text-muted text-sm mt-2">Your answer is saved. The doctor can see it. Your employer does not see this follow up.</p>}
        {status === 'failed' && <p className="text-muted text-sm mt-2">Your check-in is not saved yet. What you typed is still here. Try again in a few minutes.</p>}
        {status === 'idle' && <p className="text-muted text-sm mt-2">This follow up is still open. Save an answer when you can.</p>}
      </section>
    );
  }

  if (savedToday || status === 'saved') {
    return (
      <section className="bg-panel border border-line rounded-2xl p-5">
        <h3 className="font-head font-semibold">Today&apos;s duties</h3>
        <p className="text-muted text-sm mt-2">Today&apos;s check-in is already saved. Nothing else is due now.</p>
        {status === 'saved' && <p className="text-muted text-sm mt-2">Your check-in is saved. The doctor can see what you reported. Your employer does not see this check-in.</p>}
      </section>
    );
  }

  const showWorse = draft.performed.length > 0;
  const showWhich = showWorse && draft.worse === 'yes';
  const showSettle = showWhich;

  return (
    <section className="bg-panel border border-line rounded-2xl p-5">
      <h3 className="font-head font-semibold">Today&apos;s duties</h3>
      <p className="text-muted text-sm mt-2">This check-in is about the duties on your plan today. It is not a score.</p>

      <p className="font-semibold mt-4">Which of today&apos;s approved duties did you do?</p>
      <p className="text-muted text-xs mt-1">Pick every duty you actually did. The list comes from your current plan.</p>
      {duties.length === 0 ? (
        <p className="text-muted text-sm mt-2">There are no approved duties on your plan today. You have nothing to mark.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {duties.map((d) => (
            <li key={d.duty_id}>
              <label className="flex items-center gap-3 min-h-12 w-full">
                <input
                  type="checkbox"
                  className={'h-5 w-5 shrink-0 accent-gold ' + FOCUS}
                  checked={draft.performed.includes(d.duty_name)}
                  onChange={() => {
                    const on = draft.performed.includes(d.duty_name);
                    const performed = on ? draft.performed.filter((n) => n !== d.duty_name) : [...draft.performed, d.duty_name];
                    setDraft({ ...draft, performed, worseDuties: draft.worseDuties.filter((n) => performed.includes(n)) });
                  }}
                />
                <span>{d.duty_name} <span className="text-muted text-xs">(fixture)</span></span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {showWorse && (
        <>
          <p className="font-semibold mt-4">Did any of those duties make your symptoms worse?</p>
          <p className="text-muted text-xs mt-1">This is about the duties you did today, not a score.</p>
          <div className="flex flex-col gap-2 mt-2">
            <button type="button" className={choiceClass(draft.worse === 'no')} aria-pressed={draft.worse === 'no'} onClick={() => setDraft({ ...draft, worse: 'no', worseDuties: [], settled: '' })}>No</button>
            <button type="button" className={choiceClass(draft.worse === 'yes')} aria-pressed={draft.worse === 'yes'} onClick={() => setDraft({ ...draft, worse: 'yes' })}>Yes</button>
          </div>
        </>
      )}

      {showWhich && (
        <>
          <p className="font-semibold mt-4">Which duty or duties made your symptoms worse?</p>
          <p className="text-muted text-xs mt-1">You can pick more than one.</p>
          <ul className="mt-2 space-y-2">
            {draft.performed.map((name) => (
              <li key={name}>
                <label className="flex items-center gap-3 min-h-12 w-full">
                  <input
                    type="checkbox"
                    className={'h-5 w-5 shrink-0 accent-gold ' + FOCUS}
                    checked={draft.worseDuties.includes(name)}
                    onChange={() => {
                      const on = draft.worseDuties.includes(name);
                      setDraft({ ...draft, worseDuties: on ? draft.worseDuties.filter((n) => n !== name) : [...draft.worseDuties, name] });
                    }}
                  />
                  <span>{name}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}

      {showSettle && (
        <>
          <p className="font-semibold mt-4">Had that worsening settled by the end of your shift?</p>
          <p className="text-muted text-xs mt-1">Settled means you felt the same as before that duty, by the time your shift ended.</p>
          <div className="flex flex-col gap-2 mt-2">
            <button type="button" className={choiceClass(draft.settled === 'yes')} aria-pressed={draft.settled === 'yes'} onClick={() => setDraft({ ...draft, settled: 'yes' })}>Yes, it had settled</button>
            <button type="button" className={choiceClass(draft.settled === 'no')} aria-pressed={draft.settled === 'no'} onClick={() => setDraft({ ...draft, settled: 'no' })}>No, it had not settled</button>
          </div>
        </>
      )}

      <p className="font-semibold mt-4">Hours today</p>
      <p className="text-sm mt-1">Approved hours today: {approvedHours === 'UNKNOWN' ? 'UNKNOWN' : approvedHours}</p>
      <label className="block font-semibold mt-3" htmlFor="hours-worked">Hours you worked today</label>
      <p className="text-muted text-xs mt-1">Type the hours you actually worked. This is not a score.</p>
      <input id="hours-worked" type="number" min={0} step="0.25" className={'w-full min-h-12 bg-chipbg border border-line rounded-xl p-3 mt-2 text-ink ' + FOCUS} value={draft.hoursWorked} onChange={(e) => setDraft({ ...draft, hoursWorked: e.target.value })} />

      <label className="block font-semibold mt-4" htmlFor="free-text">Anything else you want to say?</label>
      <p className="text-muted text-xs mt-1">Optional. In your own words. This is recorded as worker reported.</p>
      <textarea id="free-text" className={'w-full min-h-24 bg-chipbg border border-line rounded-xl p-3 mt-2 text-ink ' + FOCUS} placeholder="" value={draft.freeText} onChange={(e) => setDraft({ ...draft, freeText: e.target.value })} />

      <button className={'w-full min-h-12 bg-gold text-navy font-semibold rounded-xl mt-3 p-3 ' + FOCUS} disabled={busy} onClick={persistToday}>Save check-in</button>
      <button type="button" className={'w-full min-h-12 border border-line rounded-xl mt-2 p-3 ' + FOCUS} onClick={keepLater}>Keep for later</button>
      {status === 'failed' && <p className="text-muted text-sm mt-2">Your check-in is not saved yet. What you typed is still here. Try again in a few minutes.</p>}
      {status === 'kept' && <p className="text-muted text-sm mt-2">{online ? 'Kept on this device.' : 'Kept on this device. You are offline.'}</p>}
    </section>
  );
}
