import { createClient } from '@supabase/supabase-js';
import type {Database} from './db.d';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
