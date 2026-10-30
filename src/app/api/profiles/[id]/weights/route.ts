import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdaptiveEstimate } from "@/lib/targets";
import { isFiniteNumber, isNonEmptyString } from "@/lib/validate";
import { authorizeProfile } from "@/lib/session";
import { recordProfileChange } from "@/lib/profile-history";

type Context = { params: Promise<{ id: string }> };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

// El peso del perfil siempre refleja el último registro, para que las metas se mantengan al día.
async function syncProfileWeight(profileId: string) {
  const latest = await prisma.weightLog.findFirst({
    where: { profileId },
    orderBy: { date: "desc" },
  });
  if (latest) {
    const before = await prisma.profile.findUnique({ where: { id: profileId } });
    const after = await prisma.profile.update({
      where: { id: profileId },
      data: { weightKg: latest.weightKg },
    });
    // Un cambio de peso mueve las calorías: queda en el historial del perfil.
    if (before) await recordProfileChange({ before, after, source: "WEIGHT" });
  }
}

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeProfile(id);
  if (!auth.ok) return auth.response;

  const logs = await prisma.weightLog.findMany({
    where: { profileId: id },
    orderBy: { date: "desc" },
    take: 120,
  });
  const estimate = await getAdaptiveEstimate(id);
  return NextResponse.json({ logs, estimate });
}

export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeProfile(id);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const { date, weightKg } = body ?? {};

  if (
    !isNonEmptyString(date) ||
    !DATE_KEY.test(date) ||
    !isFiniteNumber(weightKg) ||
    weightKg < 20 ||
    weightKg > 400
  ) {
    return NextResponse.json({ error: "Fecha o peso inválidos." }, { status: 400 });
  }

  const log = await prisma.weightLog.upsert({
    where: { profileId_date: { profileId: id, date } },
    update: { weightKg },
    create: { profileId: id, date, weightKg },
  });
  await syncProfileWeight(id);

  return NextResponse.json(log, { status: 201 });
}

export async function DELETE(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeProfile(id);
  if (!auth.ok) return auth.response;

  const date = request.nextUrl.searchParams.get("date");
  if (!isNonEmptyString(date) || !DATE_KEY.test(date)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  try {
    await prisma.weightLog.delete({ where: { profileId_date: { profileId: id, date } } });
  } catch {
    return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
  }
  await syncProfileWeight(id);
  return NextResponse.json({ ok: true });
}
