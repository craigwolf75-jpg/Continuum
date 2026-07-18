'use client';
import { useState } from 'react';
import { useSession } from '@/state/SessionProvider';
import { useSync } from '@/state/SyncProvider';
import BottomNav, { type Tab } from './BottomNav';
import Home from './Home';
import History from './History';
import Duties from './Duties';
import Settings from './Settings';

function SyncChip() {
  const { online, pending, syncing } = useSync();
  let label = 'Synced';
  if (!online) label = pending > 0 ? `Offline, ${pending} waiting` : 'Offline';
  else if (syncing) label = 'Syncing...';
  else if (pending > 0) label = `${pending} to send`;
  const color = !online ? 'text-goldsoft' : pending > 0 || syncing ? 'text-goldsoft' : 'text-muted';
  return <span className={'text-xs font-body font-medium ' + color}>{label}</span>;
}

export default function AppShell() {
  const { tenant } = useSession();
  const [tab, setTab] = useState<Tab>('home');
  const name = tenant?.branding?.display_name || tenant?.name || 'Continuum';
  return (
    <div className="max-w-md mx-auto min-h-screen pb-16">
      <header className="sticky top-0 bg-navy/95 border-b border-line px-5 py-3 font-head font-bold flex items-center justify-between">
        <span>{name}<span className="text-gold">.</span></span>
        <SyncChip />
      </header>
      <div className="px-5 py-4">
        {tab === 'home' && <Home />}
        {tab === 'history' && <History />}
        {tab === 'duties' && <Duties />}
        {tab === 'settings' && <Settings />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
