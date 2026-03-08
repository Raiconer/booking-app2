import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { addRuntimeSpecialist, getRuntimeCatalog } from "@/lib/catalog-store";
import { Specialist } from "@/lib/types";

export const runtime = "nodejs";

type CreateSpecialistBody = {
  fullName: string;
  role: string;
  city: string;
  serviceIds: string[];
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const catalog = await getRuntimeCatalog();
    return NextResponse.json({ specialists: catalog.specialists });
  } catch {
    return NextResponse.json({ error: "Nie udało się pobrać specjalistów" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSpecialistBody;

    if (!body.fullName || !body.role || !body.city || !Array.isArray(body.serviceIds)) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    if (body.serviceIds.length === 0) {
      return NextResponse.json({ error: "Wybierz co najmniej jedną usługę" }, { status: 400 });
    }

    const catalog = await getRuntimeCatalog();
    const validServiceIds = new Set(catalog.services.map((item) => item.id));
    const hasInvalidService = body.serviceIds.some((item) => !validServiceIds.has(item));
    if (hasInvalidService) {
      return NextResponse.json({ error: "Wybrano nieprawidłową usługę" }, { status: 400 });
    }

    const baseId = slugify(body.fullName);
    const candidateId = `spec-${baseId || randomUUID().slice(0, 8)}`;
    const alreadyExists = catalog.specialists.some((item) => item.id === candidateId);

    const created: Specialist = {
      id: alreadyExists ? `${candidateId}-${randomUUID().slice(0, 6)}` : candidateId,
      fullName: body.fullName.trim(),
      role: body.role.trim(),
      city: body.city.trim(),
      serviceIds: Array.from(new Set(body.serviceIds))
    };

    await addRuntimeSpecialist(created);
    return NextResponse.json({ specialist: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Nie udało się dodać specjalisty" }, { status: 500 });
  }
}
