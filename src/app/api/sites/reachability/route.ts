import { NextResponse } from "next/server";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { checkSiteReachability } from "~/lib/ui/siteReachability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstream = searchParams.get("upstream");
  const subdomain = searchParams.get("subdomain");

  if (!upstream) {
    return NextResponse.json(
      { error: "Missing 'upstream' query parameter." },
      { status: 400 },
    );
  }

  const config = await getSiteConfig();
  const online = await checkSiteReachability(upstream, {
    subdomain,
    baseDomain: config?.baseDomain,
  });
  return NextResponse.json({ online });
}
