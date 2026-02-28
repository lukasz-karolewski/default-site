"use server";

import { revalidatePath } from "next/cache";
import { addSite, removeSite, updateSite } from "~/lib/data/siteService";
import { syncCaddyForCrud } from "~/lib/caddy/caddySyncCrud";

export interface SiteActionState {
	ok: boolean;
	message: string | null;
}

function toNotice(
	prefix: string,
	sync: { applied: boolean; error: string | null },
) {
	if (sync.applied) {
		return `${prefix} Synced to Caddy.`;
	}
	return `${prefix} Saved locally; sync pending. ${sync.error ?? "Caddy is currently unreachable."}`;
}

async function runSaveSiteAction(formData: FormData): Promise<SiteActionState> {
	const id = (formData.get("id")?.toString() ?? "").trim();
	const host = (formData.get("host")?.toString() ?? "").trim();
	const upstream = (formData.get("upstream")?.toString() ?? "").trim();

	if (!host || !upstream) {
		return { ok: false, message: "Host and upstream are required." };
	}

	try {
		if (id) {
			await updateSite(id, host, upstream);
		} else {
			await addSite(host, upstream);
		}

		const sync = await syncCaddyForCrud();
		revalidatePath("/");
		return {
			ok: true,
			message: toNotice(id ? "Site updated." : "Site added.", sync),
		};
	} catch (error: unknown) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : "Failed to save site.",
		};
	}
}

async function runDeleteSiteAction(
	formData: FormData,
): Promise<SiteActionState> {
	const id = (formData.get("id")?.toString() ?? "").trim();
	if (!id) {
		return { ok: false, message: "Missing site id for delete." };
	}

	try {
		await removeSite(id);
		const sync = await syncCaddyForCrud();
		revalidatePath("/");
		return { ok: true, message: toNotice("Site deleted.", sync) };
	} catch (error: unknown) {
		return {
			ok: false,
			message:
				error instanceof Error ? error.message : "Failed to delete site.",
		};
	}
}

export async function saveSiteAction(
	_prevState: SiteActionState,
	formData: FormData,
): Promise<SiteActionState> {
	return runSaveSiteAction(formData);
}

export async function deleteSiteAction(
	_prevState: SiteActionState,
	formData: FormData,
): Promise<SiteActionState> {
	return runDeleteSiteAction(formData);
}
