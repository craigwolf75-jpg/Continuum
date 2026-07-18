'use client';
import { useState } from 'react';
import { requestOtp, verifyOtp } from '@/lib/auth';

export default function Login() {
  const [phone, setPhone] = useState('+1');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true); setError(null);
    try { await requestOtp(phone.trim()); setSent(true); }
    catch (e: any) { setError(e.message || 'Could not send the code.'); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError(null);
    try { await verifyOtp(phone.trim(), code.trim()); }
    catch (e: any) { setError(e.message || 'That code did not work.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 max-w-md mx-auto">
      <div className="font-head text-2xl font-bold mb-1">Contin<span className="text-gold">uum</span></div>
      <p className="text-muted mb-6">Sign in to your recovery check-ins.</p>
      {!sent ? (
        <>
          <label className="text-sm font-semibold">Your phone number</label>
          <input className="w-full bg-chipbg border border-line rounded-xl px-4 my-2 text-ink" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" />
          <button className="w-full bg-gold text-navy font-semibold rounded-xl mt-2" disabled={busy} onClick={send}>Send me a code</button>
        </>
      ) : (
        <>
          <label className="text-sm font-semibold">Enter the 6-digit code</label>
          <input className="w-full bg-chipbg border border-line rounded-xl px-4 my-2 text-ink tracking-widest text-center text-xl" value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" maxLength={6} />
          <button className="w-full bg-gold text-navy font-semibold rounded-xl mt-2" disabled={busy} onClick={verify}>Sign in</button>
          <button className="w-full border border-line text-ink rounded-xl mt-2" onClick={() => setSent(false)}>Use a different number</button>
        </>
      )}
      {error && <p className="text-goldsoft mt-3 text-sm">{error}</p>}
      <p className="text-muted text-xs mt-6 text-center">By continuing you agree to the <a className="text-goldsoft" href="/terms">Terms of Service</a> and <a className="text-goldsoft" href="/privacy">Privacy Policy</a>.</p>
    </main>
  );
}
