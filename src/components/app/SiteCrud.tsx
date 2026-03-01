import type { SiteRecord } from "~/lib/data/schema";
import CaddyStatusPanel from "./CaddyStatusPanel";
import ManageSitesPanel from "./ManageSitesPanel";
import PublishedSitesPanel from "./PublishedSitesPanel";

interface SiteCrudProps {
  sites: SiteRecord[];
  baseDomain: string;
  editSiteId?: string;
  notice?: string;
}

export default function SiteCrud({
  sites,
  baseDomain,
  editSiteId,
  notice,
}: SiteCrudProps) {
  const editingSite = sites.find((site) => site.id === editSiteId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <CaddyStatusPanel />
        <PublishedSitesPanel sites={sites} baseDomain={baseDomain} />
      </div>

      <ManageSitesPanel editingSite={editingSite} notice={notice} />
    </div>
  );
}
