import { getSites } from "./utils/siteService";
import SiteGridPage from "./components/SiteGridPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sites = await getSites();

  return <SiteGridPage sites={sites} baseDomain={process.env.BASE_DOMAIN ?? "localhost"} />;
}
