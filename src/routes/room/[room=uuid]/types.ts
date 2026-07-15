import type { Database } from '$lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Class = Database['public']['Tables']['classes']['Row'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used to derive the RPC row type
async function getClasses(supabase: SupabaseClient<Database>, room: string) {
	return await supabase.rpc('get_classes_with_usage', { room_id: room });
}

export type Classes = NonNullable<Awaited<ReturnType<typeof getClasses>>['data']>;
export type ClassWithUsage = Classes[number];
