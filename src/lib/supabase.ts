import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqttljgjwyzoqsxqwoap.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase configuration missing in environment variables. Please check .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const PULSE_N8N_WEBHOOK_URL = `${
  import.meta.env.VITE_N8N_WEBHOOK_BASE_URL || 'https://praveen5841111.app.n8n.cloud'
}/webhook/routiva-pulse-whatsapp`;
