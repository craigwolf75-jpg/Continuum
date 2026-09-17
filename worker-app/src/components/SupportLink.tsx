'use client';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

export default function SupportLink() {
  return (
    <a
      href="/worker/get-help.html#resources"
      className={'block bg-panel border border-line rounded-2xl p-4 ' + FOCUS}
    >
      <div className="font-head font-semibold">Support resources</div>
      <p className="text-muted text-sm mt-1">For your province or territory. Always here. This is not based on anything you typed.</p>
    </a>
  );
}
