import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://amrcqpejikecymzoyxbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_p4P5tLBJ0sid_IZ3LfBf2w_SuHsSe_Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
