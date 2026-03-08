import { NextResponse } from "next/server";
import { getRuntimeCatalog } from "@/lib/catalog-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const catalog = await getRuntimeCatalog();
    return NextResponse.json(catalog);
  } catch {
    return NextResponse.json({ error: "Nie udało się pobrać katalogu" }, { status: 500 });
  }
}
