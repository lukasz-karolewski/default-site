import { NextResponse } from "next/server";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { detectFavicon } from "~/lib/ui/faviconDetect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain")?.trim();

  if (!subdomain) {
    return NextResponse.json(
      { error: "Missing 'subdomain' query parameter." },
      { status: 400 },
    );
  }

  const config = await getSiteConfig();
  const baseDomain = config?.baseDomain?.trim();
  if (!baseDomain) {
    return NextResponse.json(
      { error: "Base domain is not configured." },
      { status: 400 },
    );
  }

  const favicons = await detectFavicon({
    subdomain,
    baseDomain,
  });
  return NextResponse.json({ favicons });
}
