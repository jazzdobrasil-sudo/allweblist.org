/**
 * Supabase Configuration
 * Replace with your actual Supabase credentials
 */

// ⚠️ REPLACE THESE WITH YOUR ACTUAL VALUES FROM SUPABASE
const SUPABASE_URL = 'https://jnppecgajvjkrawzuouy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucHBlY2dhanZqa3Jhd3p1b3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTg1NzksImV4cCI6MjA3ODIzNDU3OX0.EuuXJQNkbQDwjsWWE7aUnSyH4TJDgaPGytHht8FmaCY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;
