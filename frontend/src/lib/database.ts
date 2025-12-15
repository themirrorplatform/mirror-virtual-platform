/**
 * Database Adapter - Supabase Integration
 * Adapts MVP 01's IndexedDB interface to Supabase PostgreSQL
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Reflections Table Operations
 */
export const reflectionsDB = {
  async save(reflection: any) {
    const { data, error } = await supabase
      .from('reflections')
      .insert([reflection])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('reflections')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('reflections')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

/**
 * Threads Table Operations
 */
export const threadsDB = {
  async save(thread: any) {
    const { data, error } = await supabase
      .from('threads')
      .insert([thread])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};

/**
 * User Settings Operations
 */
export const settingsDB = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async save(userId: string, settings: any) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...settings })
      .select();
    if (error) throw error;
    return data[0];
  }
};

/**
 * Crisis Logs (for pattern detection)
 */
export const crisisDB = {
  async log(userId: string, detection: any) {
    const { data, error } = await supabase
      .from('crisis_logs')
      .insert([{ user_id: userId, ...detection }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getRecent(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('crisis_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }
};

// Legacy IndexedDB compatibility layer (for offline mode)
export const initDatabase = async () => {
  // Database is initialized via Supabase migrations
  console.log('Supabase database ready');
};
