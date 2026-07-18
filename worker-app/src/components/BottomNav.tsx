'use client';
export type Tab = 'home' | 'history' | 'duties' | 'settings';
const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' }, { id: 'history', label: 'History' },
  { id: 'duties', label: 'Duties' }, { id: 'settings', label: 'Settings' }
];
export default function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-panel2 border-t border-line flex">
      {TABS.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          className={'flex-1 text-xs font-semibold ' + (tab === t.id ? 'text-gold' : 'text-muted')}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
