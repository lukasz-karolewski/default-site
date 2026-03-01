import { NextResponse } from "next/server";
import { checkSiteReachability } from "~/lib/ui/siteReachability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstream = searchParams.get("upstream");

  if (!upstream) {
    return NextResponse.json(
      { error: "Missing 'upstream' query parameter." },
      { status: 400 },
    );
  }

  const online = await checkSiteReachability(upstream);
  return NextResponse.json({ online });
}
