/**
 * Supabase Authentication Helper
 * Integrates Supabase Auth with The Mirror Platform
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth as apiAuth } from './api';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Initialize auth session and sync with API client
 */
export async function initializeAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    apiAuth.setToken(session.access_token);
  }
  
  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      apiAuth.setToken(session.access_token);
    } else {
      apiAuth.clearToken();
    }
  });
  
  return session;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  if (data.session?.access_token) {
    apiAuth.setToken(data.session.access_token);
  }
  
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) throw error;
  
  apiAuth.clearToken();
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  return user;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) throw error;
}
