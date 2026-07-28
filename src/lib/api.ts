import { supabase } from './supabase';
import type { AppData, User } from './types';
import { createSeededData } from '../data/seed';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  grad: [string, string];
  focus: string;
}

function userFromAuth(email: string, name?: string): AuthUser {
  return {
    id: email,
    name: name ?? email.split('@')[0],
    email,
    role: 'Workspace owner',
    grad: ['#2f6bff', '#7c5cff'],
    focus: '',
  };
}

export async function signUpApi(name: string, email: string, password: string): Promise<{ user: AuthUser; data: AppData }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Sign-up failed — no user returned.');

  const authUser = userFromAuth(email, name);
  const seeded = createSeededData(authUser);
  await saveWorkspaceApi(data.user.id, seeded);
  return { user: authUser, data: seeded };
}

export async function signInApi(email: string, password: string): Promise<{ user: AuthUser; data: AppData | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Sign-in failed — no user returned.');

  const authUser = userFromAuth(email);
  const existing = await fetchWorkspaceApi(data.user.id);
  return { user: authUser, data: existing };
}

export async function signOutApi(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  return userFromAuth(data.session.user.email ?? '');
}

export async function fetchWorkspaceApi(userId: string): Promise<AppData | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('payload')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.payload as AppData | null) ?? null;
}

export async function saveWorkspaceApi(userId: string, payload: AppData): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .upsert({ user_id: userId, payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

export async function resetWorkspaceApi(userId: string): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function importWorkspaceApi(userId: string, raw: string): Promise<void> {
  const parsed = JSON.parse(raw);
  await saveWorkspaceApi(userId, parsed);
}

export type { User };
