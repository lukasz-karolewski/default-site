import { redirect } from "next/navigation";
import SiteGridPage from "~/components/app/SiteGridPage";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { getSites } from "~/lib/data/siteService";

export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await getSiteConfig();
  if (!config || config.onboardingStatus !== "completed") {
    redirect("/onboarding");
  }

  const sites = await getSites();
  return <SiteGridPage sites={sites} baseDomain={config.baseDomain} />;
}
