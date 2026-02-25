'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addSite, removeSite, updateSite } from '../utils/siteService';
import { syncCaddyForCrud } from '../utils/caddySyncCrud';

function toNotice(prefix: string, sync: { applied: boolean; error: string | null }) {
  if (sync.applied) {
    return `${prefix} Synced to Caddy.`;
  }
  return `${prefix} Saved locally; sync pending. ${sync.error ?? 'Caddy is currently unreachable.'}`;
}

function redirectHome(notice: string, editId?: string) {
  const params = new URLSearchParams();
  params.set('notice', notice);
  if (editId) params.set('edit', editId);
  redirect(`/?${params.toString()}`);
}

export async function saveSiteAction(formData: FormData) {
  const id = (formData.get('id')?.toString() ?? '').trim();
  const host = (formData.get('host')?.toString() ?? '').trim();
  const upstream = (formData.get('upstream')?.toString() ?? '').trim();

  if (!host || !upstream) {
    redirectHome('Host and upstream are required.', id || undefined);
  }

  if (id) {
    await updateSite(id, host, upstream);
  } else {
    await addSite(host, upstream);
  }

  const sync = await syncCaddyForCrud();
  revalidatePath('/');
  redirectHome(toNotice(id ? 'Site updated.' : 'Site added.', sync));
}

export async function deleteSiteAction(formData: FormData) {
  const id = (formData.get('id')?.toString() ?? '').trim();
  if (!id) {
    redirectHome('Missing site id for delete.');
  }

  await removeSite(id);
  const sync = await syncCaddyForCrud();
  revalidatePath('/');
  redirectHome(toNotice('Site deleted.', sync));
}
