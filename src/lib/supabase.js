import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Modo offline: se não tem credenciais, usa localStorage
export const isSupabaseConfigured =
 supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const supabase = isSupabaseConfigured
 ? createClient(supabaseUrl, supabaseAnonKey)
 : null;

// ========== AUTH ==========
export const auth = {
 signUp: async (email, password, name) => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 const { data, error } = await supabase.auth.signUp({
 email,
 password,
 options: { data: { full_name: name } },
 });
 return { data, error };
 },

 signIn: async (email, password) => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 const { data, error } = await supabase.auth.signInWithPassword({
 email,
 password,
 });
 return { data, error };
 },

 signInWithGoogle: async () => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 const { data, error } = await supabase.auth.signInWithOAuth({
 provider: 'google',
 options: {
 redirectTo: `${window.location.origin}/app`,
 queryParams: {
 access_type: 'offline',
 prompt: 'consent',
 },
 },
 });
 return { data, error };
 },

 signOut: async () => {
 if (!supabase) return { error: null };
 const { error } = await supabase.auth.signOut();
 return { error };
 },

 getUser: async () => {
 if (!supabase) return { data: { user: null }, error: null };
 return supabase.auth.getUser();
 },

 getSession: async () => {
 if (!supabase) return { data: { session: null }, error: null };
 return supabase.auth.getSession();
 },

 onAuthStateChange: (callback) => {
 if (!supabase) return { data: { subscription: { unsubscribe: () => { } } } };
 return supabase.auth.onAuthStateChange(callback);
 },
};

// ========== TRANSACTIONS (DB) ==========
export const db = {
 transactions: {
 getAll: async (userId) => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 const { data, error } = await supabase
 .from('transactions')
 .select('*')
 .eq('user_id', userId)
 .order('date', { ascending: false });
 return { data, error };
 },

 create: async (transaction) => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 const { data, error } = await supabase
 .from('transactions')
 .insert(transaction)
 .select()
 .single();
 return { data, error };
 },

 bulkCreate: async (transactionsArray) => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 const { data, error } = await supabase
 .from('transactions')
 .insert(transactionsArray)
 .select();
 return { data, error };
 },

 update: async (id, updates, userId) => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 // FIX L3 — Defense-in-depth: Exigir userId em mutações
 if (!userId) return { data: null, error: { message: 'userId é obrigatório para atualização' } };
 const query = supabase
 .from('transactions')
 .update({ ...updates, updated_at: new Date().toISOString() })
 .eq('id', id)
 .eq('user_id', userId);

 const { data, error } = await query
 .select()
 .single();
 return { data, error };
 },

 delete: async (id, userId) => {
 if (!supabase) return { error: { message: 'Supabase não configurado' } };
 // FIX L3 — Defense-in-depth: Exigir userId em mutações
 if (!userId) return { error: { message: 'userId é obrigatório para exclusão' } };
 const query = supabase
 .from('transactions')
 .delete()
 .eq('id', id)
 .eq('user_id', userId);

 const { error } = await query;
 return { error };
 },

 getByDateRange: async (userId, startDate, endDate) => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 const { data, error } = await supabase
 .from('transactions')
 .select('*')
 .eq('user_id', userId)
 .gte('date', startDate)
 .lte('date', endDate)
 .order('date', { ascending: false });
 return { data, error };
 },

 getSummary: async (userId) => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 const { data, error } = await supabase.rpc('get_transaction_summary', {
 p_user_id: userId,
 });
 return { data, error };
 },
 },

 waitlist: {
 add: async (email) => {
 if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };
 const { data, error } = await supabase
 .from('waitlist')
 .insert({ email })
 .select()
 .single();
 return { data, error };
 },
 },
};
