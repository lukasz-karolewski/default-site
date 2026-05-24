import { deleteSiteAction, saveSiteAction } from "~/lib/actions/siteActions";

interface Site {
  id: string;
  subdomain: string;
  upstream: string;
}

interface ManageSitesPanelProps {
  editingSite?: Site;
  notice?: string;
}

export default function ManageSitesPanel({
  editingSite,
  notice,
}: ManageSitesPanelProps) {
  async function saveSiteFormAction(formData: FormData) {
    "use server";
    await saveSiteAction({ message: null, ok: false }, formData);
  }

  async function deleteSiteFormAction(formData: FormData) {
    "use server";
    await deleteSiteAction({ message: null, ok: false }, formData);
  }

  return (
    <section className="brutal-panel p-5">
      <h2 className="brutal-title text-2xl text-zinc-900">Manage Sites</h2>
      <p className="mt-1 text-sm font-semibold text-zinc-700">
        Create and update subdomain routing records.
      </p>

      {notice && (
        <output
          aria-live="polite"
          className="mt-3 border-2 border-black bg-[#ffe27a] px-3 py-2 text-sm font-bold text-zinc-900"
        >
          {notice}
        </output>
      )}

      <form
        action={saveSiteFormAction}
        className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5"
      >
        <input name="id" type="hidden" value={editingSite?.id ?? ""} />
        <input
          className="border-2 border-black bg-white p-2 font-semibold text-zinc-900 placeholder:text-zinc-500 focus:outline-none md:col-span-2"
          defaultValue={editingSite?.subdomain ?? ""}
          name="subdomain"
          placeholder="Subdomain (e.g. app)"
          required
        />
        <input
          className="border-2 border-black bg-white p-2 font-semibold text-zinc-900 placeholder:text-zinc-500 focus:outline-none md:col-span-2"
          defaultValue={editingSite?.upstream ?? ""}
          name="upstream"
          placeholder="Upstream (e.g. localhost:3000)"
          required
        />
        <button
          className="border-2 border-black bg-black px-4 py-2 font-black uppercase tracking-[0.08em] text-white transition hover:bg-zinc-800"
          type="submit"
        >
          {editingSite ? "Update Site" : "Add Site"}
        </button>
      </form>

      {editingSite && (
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={deleteSiteFormAction}>
            <input name="id" type="hidden" value={editingSite.id} />
            <button
              className="border-2 border-black bg-[#ff3b30] px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e52f25]"
              type="submit"
            >
              Delete
            </button>
          </form>
          <a
            className="border-2 border-black bg-zinc-300 px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-zinc-900 transition hover:bg-zinc-200"
            href="/"
          >
            Cancel
          </a>
        </div>
      )}
    </section>
  );
}
