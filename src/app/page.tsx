import SiteCrud from './components/SiteCrud';
import { getSites } from './utils/siteService';

export const dynamic = 'force-dynamic';

type HomeProps = {
  searchParams: Promise<{ edit?: string | string[]; notice?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const sites = await getSites();
  const params = await searchParams;
  const editSiteId = Array.isArray(params.edit) ? params.edit[0] : params.edit;
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <section className="mx-auto w-full max-w-5xl animate-[brutal-pop_420ms_ease-out_both]">
        <header className="mb-6 brutal-panel p-6">
          <h1 className="brutal-title mt-2 text-4xl sm:text-6xl">Local sites</h1>
        </header>
        <SiteCrud
          sites={sites}
          baseDomain={process.env.BASE_DOMAIN ?? 'localhost'}
          editSiteId={editSiteId}
          notice={notice}
        />
      </section>
    </main>
  );
}
