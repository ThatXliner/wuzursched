import type { Database } from '$lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Class = Database['public']['Tables']['classes']['Row'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used to derive the RPC row type
async function getClasses(supabase: SupabaseClient<Database>, room: string) {
	return await supabase.rpc('get_classes_with_usage', { room_id: room });
}

type RpcClasses = NonNullable<Awaited<ReturnType<typeof getClasses>>['data']>;

// PostgreSQL function result columns are generated as non-null even when the
// selected table columns are nullable. Preserve the classes table's teacher
// identity nullability while deriving the rest of the RPC result shape.
export type ClassWithUsage = Omit<RpcClasses[number], 'teacher_first' | 'teacher_title'> &
	Pick<Class, 'teacher_first' | 'teacher_title'>;
export type Classes = ClassWithUsage[];
