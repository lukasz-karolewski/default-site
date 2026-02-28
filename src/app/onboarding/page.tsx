import { redirect } from "next/navigation";
import OnboardingForm from "~/components/app/OnboardingForm";
import {
  ensureOnboardingDraft,
  getOnboardingState,
} from "~/lib/caddy/onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const query = await props.searchParams;
  const editMode = query.edit !== undefined;

  const state = await getOnboardingState();
  if (state.complete && !editMode) {
    redirect("/");
  }

  const draft = await ensureOnboardingDraft();

  return (
    <OnboardingForm
      initialBaseDomain={draft.baseDomain}
      initialCaddyApi={draft.caddyApi}
      initialDashboardUpstream={draft.dashboardUpstream}
      initialDirectives={draft.siteBlockDirectives}
      importedSites={draft.importedSites}
    />
  );
}
