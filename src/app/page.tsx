import { getSites } from "./utils/siteService";
import SiteGridPage from "./components/SiteGridPage";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const sites = await getSites();
  const params = await searchParams;
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;

  return (
    <SiteGridPage
      sites={sites}
      baseDomain={process.env.BASE_DOMAIN ?? "localhost"}
      notice={notice}
    />
  );
}
