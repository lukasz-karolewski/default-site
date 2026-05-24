"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
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
  manualCommands: [],
  message: null,
  ok: false,
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
            <label className="text-sm font-medium" htmlFor="baseDomain">
              Base domain
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="baseDomain"
              name="baseDomain"
              onChange={(event) => setBaseDomain(event.target.value)}
              required
              value={baseDomain}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              htmlFor="siteBlockDirectives"
            >
              Site block directives
            </label>
            <p className="text-xs text-muted-foreground">
              Applied inside the managed wildcard site block.
            </p>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
              id="siteBlockDirectives"
              name="siteBlockDirectives"
              onChange={(event) => setSiteBlockDirectives(event.target.value)}
              required
              rows={8}
              value={siteBlockDirectives}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="caddyApi">
              Caddy API URL
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="caddyApi"
              name="caddyApi"
              onChange={(event) => setCaddyApi(event.target.value)}
              required
              value={caddyApi}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="dashboardUpstream">
              Dashboard upstream
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="dashboardUpstream"
              name="dashboardUpstream"
              onChange={(event) => setDashboardUpstream(event.target.value)}
              required
              value={dashboardUpstream}
            />
          </div>

          {state.message ? (
            <output
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {state.message}
            </output>
          ) : null}

          {state.manualCommands.length > 0 ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Manual recovery commands:</p>
              {state.manualCommands.map((command) => (
                <pre
                  className="overflow-x-auto rounded-md border border-border bg-muted p-2"
                  key={command}
                >
                  <code>{command}</code>
                </pre>
              ))}
            </div>
          ) : null}

          <Button disabled={pending} type="submit">
            {pending ? "Applying..." : "Finish onboarding"}
          </Button>
        </form>
      </div>
    </main>
  );
}
