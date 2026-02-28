import { NextResponse } from "next/server";
import { getSites } from "~/lib/data/siteService";

export async function GET() {
  const sites = await getSites();
  return NextResponse.json(sites);
}
