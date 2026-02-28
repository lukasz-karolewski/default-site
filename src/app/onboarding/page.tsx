import { redirect } from "next/navigation";
import OnboardingForm from "~/components/app/OnboardingForm";
import {
	ensureOnboardingDraft,
	getOnboardingState,
} from "~/lib/onboarding/onboarding";

export const dynamic = "force-dynamic";

function isTruthy(value: string | string[] | undefined): boolean {
	if (Array.isArray(value)) return value.some(isTruthyValue);
	return isTruthyValue(value);
}

function isTruthyValue(value: string | undefined): boolean {
	if (!value) return false;
	const normalized = value.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
}

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
	const query = await props.searchParams;
	const editMode = isTruthy(query.edit);

	const state = await getOnboardingState();
	if (state.complete && !editMode) {
		redirect("/");
	}

	const draft = await ensureOnboardingDraft();
	if (!draft) {
		redirect("/");
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
