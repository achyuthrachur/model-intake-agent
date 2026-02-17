import { supabase, supabaseEnabled } from './supabase';
import type { IntakeFormState, ChatMessage, GeneratedReport } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntakeSession {
  id: string;
  bank_name: string;
  model_name: string | null;
  form_data: IntakeFormState;
  chat_history: ChatMessage[];
  wizard_step: number;
  completion_percentage: number;
  report: GeneratedReport | null;
  status: 'in_progress' | 'complete';
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

export async function saveSession(
  session: Omit<IntakeSession, 'id' | 'created_at' | 'updated_at'> & { id?: string },
): Promise<IntakeSession | null> {
  if (!supabaseEnabled || !supabase) return null;

  const { data, error } = await supabase
    .from('intake_sessions')
    .upsert(
      {
        ...session,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select()
    .single();

  if (error) {
    console.error('Failed to save session:', error.message);
    return null;
  }

  return data as IntakeSession;
}

export async function loadSession(id: string): Promise<IntakeSession | null> {
  if (!supabaseEnabled || !supabase) return null;

  const { data, error } = await supabase
    .from('intake_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to load session:', error.message);
    return null;
  }

  return data as IntakeSession;
}

export async function listSessions(): Promise<IntakeSession[]> {
  if (!supabaseEnabled || !supabase) return [];

  const { data, error } = await supabase
    .from('intake_sessions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to list sessions:', error.message);
    return [];
  }

  return (data ?? []) as IntakeSession[];
}

export async function deleteSession(id: string): Promise<boolean> {
  if (!supabaseEnabled || !supabase) return false;

  const { error } = await supabase.from('intake_sessions').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete session:', error.message);
    return false;
  }

  return true;
}
