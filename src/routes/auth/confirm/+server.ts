import { redirect } from "@sveltejs/kit";
import type { EmailOtpType } from "@supabase/supabase-js";

export const GET = async (event) => {
	const {
		url,
		locals: { supabase },
	} = event;
	const token_hash = url.searchParams.get("token_hash") as string;
	const type = url.searchParams.get("type") as EmailOtpType | null;
	const next = url.searchParams.get("next") ?? "/";
	// Not sure if this is right... I followed the PKCE docs
	// but it looks more complicated than it needs to be
	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ token_hash, type });
		if (!error) {
			throw redirect(303, `/${next.slice(1)}`);
		}
	}

	// return the user to an error page with some instructions
	throw redirect(303, "/auth/auth-code-error");
};