"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
	completeOnboardingAction,
	type OnboardingActionState,
} from "~/lib/actions/onboardingActions";

interface OnboardingFormProps {
	initialBaseDomain: string;
	initialCaddyApi: string;
	initialDashboardUpstream: string;
	initialDirectives: string;
	importedSites: number;
}

const INITIAL_STATE: OnboardingActionState = {
	ok: false,
	message: null,
	manualCommands: [],
};

export default function OnboardingForm({
	initialBaseDomain,
	initialCaddyApi,
	initialDashboardUpstream,
	initialDirectives,
	importedSites,
}: OnboardingFormProps) {
	const router = useRouter();
	const [state, formAction, pending] = useActionState(
		completeOnboardingAction,
		INITIAL_STATE,
	);
	const [baseDomain, setBaseDomain] = useState(initialBaseDomain);
	const [siteBlockDirectives, setSiteBlockDirectives] =
		useState(initialDirectives);
	const [caddyApi, setCaddyApi] = useState(initialCaddyApi);
	const [dashboardUpstream, setDashboardUpstream] = useState(
		initialDashboardUpstream,
	);

	useEffect(() => {
		if (!state.ok) return;
		router.push("/");
		router.refresh();
	}, [router, state.ok]);

	return (
		<main className="min-h-screen px-4 py-8 sm:px-8">
			<div className="mx-auto w-full max-w-3xl space-y-6">
				<section className="rounded-md border border-border bg-background p-5">
					<h1 className="text-lg font-semibold">Initial Onboarding</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Imported {importedSites} site{importedSites === 1 ? "" : "s"} from
						the current Caddyfile.
					</p>
				</section>

				<form
					action={formAction}
					className="rounded-md border border-border bg-background p-5 space-y-4"
				>
					<div className="space-y-1.5">
						<label htmlFor="baseDomain" className="text-sm font-medium">
							Base domain
						</label>
						<input
							id="baseDomain"
							name="baseDomain"
							value={baseDomain}
							onChange={(event) => setBaseDomain(event.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="siteBlockDirectives"
							className="text-sm font-medium"
						>
							Site block directives
						</label>
						<p className="text-xs text-muted-foreground">
							Applied inside the managed wildcard site block.
						</p>
						<textarea
							id="siteBlockDirectives"
							name="siteBlockDirectives"
							value={siteBlockDirectives}
							onChange={(event) => setSiteBlockDirectives(event.target.value)}
							required
							rows={8}
							className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
						/>
					</div>

					<div className="space-y-1.5">
						<label htmlFor="caddyApi" className="text-sm font-medium">
							Caddy API URL
						</label>
						<input
							id="caddyApi"
							name="caddyApi"
							value={caddyApi}
							onChange={(event) => setCaddyApi(event.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>

					<div className="space-y-1.5">
						<label htmlFor="dashboardUpstream" className="text-sm font-medium">
							Dashboard upstream
						</label>
						<input
							id="dashboardUpstream"
							name="dashboardUpstream"
							value={dashboardUpstream}
							onChange={(event) => setDashboardUpstream(event.target.value)}
							required
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>

					{state.message ? (
						<p className="text-sm text-muted-foreground" role="status">
							{state.message}
						</p>
					) : null}

					{state.manualCommands.length > 0 ? (
						<div className="space-y-2 text-sm text-muted-foreground">
							<p>Manual recovery commands:</p>
							{state.manualCommands.map((command) => (
								<pre
									key={command}
									className="overflow-x-auto rounded-md border border-border bg-muted p-2"
								>
									<code>{command}</code>
								</pre>
							))}
						</div>
					) : null}

					<Button type="submit" disabled={pending}>
						{pending ? "Applying..." : "Finish onboarding"}
					</Button>
				</form>
			</div>
		</main>
	);
}
