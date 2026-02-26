import { redirect } from 'next/navigation';
import OnboardingForm from '~/components/app/OnboardingForm';
import { ensureOnboardingDraft, getOnboardingState } from '~/lib/onboarding/onboarding';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const state = await getOnboardingState();
  if (state.complete) {
    redirect('/');
  }

  const draft = await ensureOnboardingDraft();
  if (!draft) {
    redirect('/');
  }

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
