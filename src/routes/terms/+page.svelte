<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<!-- Obtain appropriate legal review before treating this document as final. -->

<svelte:head>
	<title>Terms of Service · Wuzursched</title>
	<meta
		name="description"
		content="Terms governing access to and use of the Wuzursched schedule-sharing service."
	/>
</svelte:head>

<section class="bg-base-200 py-12 md:py-16">
	<article class="mx-auto max-w-3xl px-6">
		<header class="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm md:p-8">
			<p class="text-lg opacity-70">The rules for using Wuzursched</p>
			<h1 class="mt-1 text-5xl font-bold md:text-6xl">Terms of Service</h1>
			<p class="mt-3 font-semibold">Effective July 14, 2026</p>
		</header>

		<div class="mt-8 space-y-8 rounded-box bg-base-100 p-6 shadow-sm md:p-10">
			<section>
				<h2 class="text-3xl font-bold">1. Agreement to these terms</h2>
				<p class="mt-2">
					These Terms of Service (the “Terms”) govern your access to and use of Wuzursched. By
					accessing or using the service, creating a room, or submitting information, you agree to
					these Terms and acknowledge our <a href={resolve('/privacy')} class="link"
						>Privacy Policy</a
					>. If you do not agree, do not use the service.
				</p>
			</section>

			<section>
				<h2 class="text-3xl font-bold">2. Who may use Wuzursched</h2>
				<p class="mt-2">
					You must be able to agree to these Terms under the laws that apply to you. Wuzursched is
					not directed to children under 13, and children under 13 may not use the service or have
					personal information submitted about them. If you are a minor, use Wuzursched only with
					the permission and supervision required from a parent, guardian, or school.
				</p>
			</section>

			<section>
				<h2 class="text-3xl font-bold">3. Rooms and shared links</h2>
				<p class="mt-2">
					Rooms are accessed through unique links rather than private accounts. A room link is not a
					password. Anyone who receives or discovers a room link may be able to read the room’s
					contents, including student names, class names, teachers, and schedules. Share links only
					with people you trust and submit only information you are comfortable sharing with that
					audience.
				</p>
			</section>

			<section>
				<h2 class="text-3xl font-bold">4. Your submissions</h2>
				<p class="mt-2">
					You keep any rights you have in information you submit. You give Wuzursched permission to
					host, store, reproduce, display, and transmit that information only as needed to operate,
					secure, and improve the service. You are responsible for your submissions and must have
					permission to share information about other people, including students and teachers.
				</p>
			</section>

			<section>
				<h2 class="text-3xl font-bold">5. Acceptable use</h2>
				<p class="mt-2">You may not use Wuzursched to:</p>
				<ul class="mt-2 list-disc space-y-1 pl-6">
					<li>break the law or violate another person’s rights;</li>
					<li>submit information you do not have permission to share;</li>
					<li>harass, impersonate, threaten, or harm another person;</li>
					<li>post sensitive information that is not needed to compare class schedules;</li>
					<li>probe, disrupt, overload, or bypass the service’s security or access controls; or</li>
					<li>use automated means to scrape rooms or collect information about other people.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-3xl font-bold">6. Service changes and enforcement</h2>
				<p class="mt-2">
					We may change, suspend, or discontinue any part of Wuzursched. We may remove content,
					restrict access, or take other reasonable action when we believe these Terms, the law, or
					the safety of users requires it. The service may occasionally be unavailable or lose
					functionality, and we do not promise that any room or submission will remain available.
				</p>
			</section>

			<section>
				<h2 class="text-3xl font-bold">7. Third-party services</h2>
				<p class="mt-2">
					Wuzursched relies on third-party services, including Supabase for database,
					authentication, and realtime features and Vercel for hosting. Those providers may process
					information as described in the Privacy Policy and under their own terms and policies.
					Links to other websites do not mean we control or endorse them.
				</p>
			</section>

			<section>
				<h2 class="text-3xl font-bold">8. Disclaimers</h2>
				<p class="mt-2">
					Wuzursched is provided “as is” and “as available.” To the fullest extent permitted by law,
					we disclaim warranties of merchantability, fitness for a particular purpose,
					non-infringement, availability, accuracy, and security. Wuzursched is a convenience for
					sharing schedules; it is not an official school record or a substitute for information
					from a school.
				</p>
			</section>

			<section>
				<h2 class="text-3xl font-bold">9. Limitation of liability</h2>
				<p class="mt-2">
					To the fullest extent permitted by law, Wuzursched and its maintainers will not be liable
					for indirect, incidental, special, consequential, exemplary, or punitive damages, or for
					lost data, use, goodwill, or profits arising from the service. Nothing in these Terms
					excludes liability that cannot lawfully be excluded.
				</p>
			</section>

			<section>
				<h2 class="text-3xl font-bold">10. Changes to these terms</h2>
				<p class="mt-2">
					We may update these Terms as the service changes. We will post the updated version here
					and change the effective date. Your continued use after an update means you accept the
					revised Terms to the extent allowed by law.
				</p>
			</section>

			<section>
				<h2 class="text-3xl font-bold">11. Contact</h2>
				<p class="mt-2">
					Questions about these Terms may be sent to
					<a href="mailto:thatxliner@gmail.com" class="link">thatxliner@gmail.com</a>.
				</p>
			</section>
		</div>
	</article>
</section>
