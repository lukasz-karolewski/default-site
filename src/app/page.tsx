import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteGridPage from "~/components/app/SiteGridPage";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { getSites } from "~/lib/data/siteService";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const title = config?.baseDomain ? `${config.baseDomain} sites` : "sites";
  return { title };
}

export default async function Home() {
  const config = await getSiteConfig();
  if (!config || config.onboardingStatus !== "completed") {
    redirect("/onboarding");
  }

  const sites = await getSites();
  return <SiteGridPage sites={sites} baseDomain={config.baseDomain} />;
}
