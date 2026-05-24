"use server";

import { completeOnboarding } from "~/lib/caddy/onboarding";

export interface OnboardingActionState {
  ok: boolean;
  message: string | null;
  manualCommands: string[];
}

export async function completeOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const baseDomain = (formData.get("baseDomain")?.toString() ?? "").trim();
  const caddyApi = (formData.get("caddyApi")?.toString() ?? "").trim();
  const dashboardUpstream = (
    formData.get("dashboardUpstream")?.toString() ?? ""
  ).trim();
  const siteBlockDirectives = (
    formData.get("siteBlockDirectives")?.toString() ?? ""
  ).trim();

  const result = await completeOnboarding({
    baseDomain,
    caddyApi,
    dashboardUpstream,
    siteBlockDirectives,
  });
  if (result.ok) {
    return {
      manualCommands: [],
      message: "Onboarding complete. Caddy config synced.",
      ok: true,
    };
  }

  return {
    manualCommands: result.manualCommands,
    message:
      result.error ??
      "Onboarding completed, but Caddy sync requires manual action.",
    ok: false,
  };
}
