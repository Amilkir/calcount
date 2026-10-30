import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTargetsForProfile } from "@/lib/targets";
import { parseProfileInput } from "@/lib/profile-input";
import { authorizeUser } from "@/lib/session";
import { recordProfileChange } from "@/lib/profile-history";

export async function GET() {
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const profiles = await prisma.profile.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "asc" },
  });
  const withTargets = await Promise.all(
    profiles.map(async (profile) => ({
      ...profile,
      targets: await getTargetsForProfile(profile),
    }))
  );
  return NextResponse.json(withTargets);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = parseProfileInput(body, "create");
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Una cuenta tiene un solo perfil.
  const existing = await prisma.profile.findUnique({ where: { userId: auth.user.id } });
  if (existing) {
    return NextResponse.json({ error: "Tu cuenta ya tiene un perfil." }, { status: 409 });
  }

  const profile = await prisma.profile.create({
    data: { ...parsed.data, userId: auth.user.id } as Parameters<
      typeof prisma.profile.create
    >[0]["data"],
  });

  await recordProfileChange({ before: null, after: profile, source: "CREATED" });

  return NextResponse.json(
    { ...profile, targets: await getTargetsForProfile(profile) },
    { status: 201 }
  );
}
