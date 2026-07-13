// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Database } from '$lib/supabase.d';
import type { createServerClient } from '@supabase/ssr';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: ReturnType<typeof createServerClient<Database>>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// export {};
