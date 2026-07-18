'use client';
import { useState } from 'react';
import { useSession } from '@/state/SessionProvider';
import BottomNav, { type Tab } from './BottomNav';
import Home from './Home';
import History from './History';
import Duties from './Duties';
import Settings from './Settings';

export default function AppShell() {
  const { tenant } = useSession();
  const [tab, setTab] = useState<Tab>('home');
  const name = tenant?.branding?.display_name || tenant?.name || 'Continuum';
  return (
    <div className="max-w-md mx-auto min-h-screen pb-16">
      <header className="sticky top-0 bg-navy/95 border-b border-line px-5 py-3 font-head font-bold">
        {name}<span className="text-gold">.</span>
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
