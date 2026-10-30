import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isNonEmptyString } from "@/lib/validate";
import { authorizeProfile } from "@/lib/session";

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");
  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");

  if (!isNonEmptyString(profileId) || !isNonEmptyString(startDate) || !isNonEmptyString(endDate)) {
    return NextResponse.json(
      { error: "Se requieren los parámetros profileId, startDate y endDate." },
      { status: 400 }
    );
  }

  const auth = await authorizeProfile(profileId);
  if (!auth.ok) return auth.response;

  const totals = await prisma.foodEntry.groupBy({
    by: ["date"],
    where: { profileId, date: { gte: startDate, lte: endDate } },
    _sum: { calories: true },
  });

  return NextResponse.json(
    totals.map((t) => ({ date: t.date, calories: t._sum.calories ?? 0 }))
  );
}
