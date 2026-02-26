import { buildSiteUrl } from '~/lib/sites/siteLink';

interface Site {
  id: string;
  host: string;
  upstream: string;
}

function queryHref(editSiteId?: string) {
  if (!editSiteId) return '/';
  const params = new URLSearchParams();
  params.set('edit', editSiteId);
  return `/?${params.toString()}`;
}

interface PublishedSitesPanelProps {
  sites: Site[];
  baseDomain: string;
}

export default function PublishedSitesPanel({ sites, baseDomain }: PublishedSitesPanelProps) {
  return (
    <section className="brutal-panel p-5 lg:col-span-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-700">Published Sites</p>
      </div>

      <ul className="mt-4 space-y-3">
        {sites.length === 0 && (
          <li className="border-2 border-dashed border-zinc-900 bg-zinc-200 p-4 text-sm font-semibold text-zinc-800">
            No sites configured yet.
          </li>
        )}
        {sites.map(site => {
          const siteUrl = buildSiteUrl(site.host, baseDomain);

          return (
            <li key={site.id} className="border-2 border-zinc-900 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <a
                    className="brutal-link text-xl text-zinc-900 transition hover:text-red-600"
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {site.host}
                  </a>
                  <p className="text-sm font-semibold text-zinc-700">Routes to {site.upstream}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    className="border-2 border-black bg-black px-2 py-1 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-zinc-800"
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </a>
                  <a
                    href={queryHref(site.id)}
                    className="border-2 border-black bg-[#ffda00] px-2 py-1 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:bg-[#f2ca00]"
                  >
                    Edit
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
