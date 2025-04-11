import SiteLink from './SiteLink';
import { parseHosts } from '../utils/hosts';

async function getHosts() {
  return parseHosts();
}

export default async function SiteList() {
  const sites = await getHosts();

  if (sites.length === 0) {
    return <div className="text-center">No sites found</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {sites.map((site: string) => (
        <SiteLink key={site} href={`https://${site}`} label={site} />
      ))}
    </div>
  );
}