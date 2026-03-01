import { NextResponse } from "next/server";
import { detectFavicon } from "~/lib/ui/faviconDetect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstream = searchParams.get("upstream");

  if (!upstream) {
    return NextResponse.json(
      { error: "Missing 'upstream' query parameter." },
      { status: 400 },
    );
  }

  const favicon = await detectFavicon(upstream);
  return NextResponse.json({ favicon });
}
