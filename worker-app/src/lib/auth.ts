import { supabase } from './supabase';
export async function requestOtp(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } });
  if (error) throw error;
}
export async function verifyOtp(phone: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
  if (error) throw error;
}
export async function signOut(): Promise<void> { await supabase.auth.signOut(); }
