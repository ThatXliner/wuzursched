import type { Database } from '$lib/supabase';

export type Class = Database['public']['Tables']['classes']['Row'];
export type Classes = Class[];
