import { NextResponse } from "next/server";
import { previewSiteInCaddy } from "~/lib/caddy/caddyPreview";
import { normalizeSiteInput, validateSiteInput } from "~/lib/sites/siteInput";

interface TestConfigPayload {
  id?: string;
  subdomain?: string;
  upstream?: string;
}

export async function POST(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as TestConfigPayload | null;
  const normalized = normalizeSiteInput({
    subdomain: body?.subdomain ?? "",
    upstream: body?.upstream ?? "",
  });
  const validationError = validateSiteInput(normalized);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const result = await previewSiteInCaddy({
    id: body?.id?.trim() || undefined,
    subdomain: normalized.subdomain,
    upstream: normalized.upstream,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to apply preview config." },
      { status: result.status ?? 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
