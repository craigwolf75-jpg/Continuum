'use client';
import { useSession } from '@/state/SessionProvider';
import Login from '@/components/Login';
import ConsentGate from '@/components/ConsentGate';
import AppShell from '@/components/AppShell';

export default function Page() {
  const { session, consent, loading } = useSession();
  if (loading) return <main className="min-h-screen grid place-items-center text-muted">Loading...</main>;
  if (!session) return <Login />;
  if (!consent) return <ConsentGate />;
  return <AppShell />;
}
