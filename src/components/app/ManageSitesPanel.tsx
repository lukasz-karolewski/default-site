import { deleteSiteAction, saveSiteAction } from '~/lib/actions/siteActions';

interface Site {
  id: string;
  host: string;
  upstream: string;
}

interface ManageSitesPanelProps {
  editingSite?: Site;
  notice?: string;
}

export default function ManageSitesPanel({ editingSite, notice }: ManageSitesPanelProps) {
  async function saveSiteFormAction(formData: FormData) {
    'use server';
    await saveSiteAction({ ok: false, message: null }, formData);
  }

  async function deleteSiteFormAction(formData: FormData) {
    'use server';
    await deleteSiteAction({ ok: false, message: null }, formData);
  }

  return (
    <section className="brutal-panel p-5">
      <h2 className="brutal-title text-2xl text-zinc-900">Manage Sites</h2>
      <p className="mt-1 text-sm font-semibold text-zinc-700">Create and update host routing records.</p>

      {notice && (
        <p className="mt-3 border-2 border-black bg-[#ffe27a] px-3 py-2 text-sm font-bold text-zinc-900" role="status">
          {notice}
        </p>
      )}

      <form action={saveSiteFormAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <input type="hidden" name="id" value={editingSite?.id ?? ''} />
        <input
          className="border-2 border-black bg-white p-2 font-semibold text-zinc-900 placeholder:text-zinc-500 focus:outline-none md:col-span-2"
          placeholder="Host (e.g. app)"
          name="host"
          defaultValue={editingSite?.host ?? ''}
          required
        />
        <input
          className="border-2 border-black bg-white p-2 font-semibold text-zinc-900 placeholder:text-zinc-500 focus:outline-none md:col-span-2"
          placeholder="Upstream (e.g. localhost:3000)"
          name="upstream"
          defaultValue={editingSite?.upstream ?? ''}
          required
        />
        <button
          type="submit"
          className="border-2 border-black bg-black px-4 py-2 font-black uppercase tracking-[0.08em] text-white transition hover:bg-zinc-800"
        >
          {editingSite ? 'Update Site' : 'Add Site'}
        </button>
      </form>

      {editingSite && (
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={deleteSiteFormAction}>
            <input type="hidden" name="id" value={editingSite.id} />
            <button
              type="submit"
              className="border-2 border-black bg-[#ff3b30] px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e52f25]"
            >
              Delete
            </button>
          </form>
          <a
            href="/"
            className="border-2 border-black bg-zinc-300 px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-zinc-900 transition hover:bg-zinc-200"
          >
            Cancel
          </a>
        </div>
      )}
    </section>
  );
}
