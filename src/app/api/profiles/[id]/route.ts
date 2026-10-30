import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTargetsForProfile } from "@/lib/targets";
import { parseProfileInput } from "@/lib/profile-input";
import { authorizeProfile } from "@/lib/session";
import { recordProfileChange } from "@/lib/profile-history";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeProfile(id);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    ...auth.profile,
    targets: await getTargetsForProfile(auth.profile),
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeProfile(id);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = parseProfileInput(body, "update");
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const profile = await prisma.profile.update({
    where: { id },
    data: parsed.data as Parameters<typeof prisma.profile.update>[0]["data"],
  });

  // Motivo opcional que el usuario escribe para justificar el cambio.
  const rawNote = (body as { changeNote?: unknown } | null)?.changeNote;
  const note = typeof rawNote === "string" ? rawNote.slice(0, 500) : null;
  await recordProfileChange({ before: auth.profile, after: profile, source: "EDIT", note });

  return NextResponse.json({ ...profile, targets: await getTargetsForProfile(profile) });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeProfile(id);
  if (!auth.ok) return auth.response;

  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
