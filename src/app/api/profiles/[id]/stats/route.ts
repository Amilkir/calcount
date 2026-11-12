import { NextRequest, NextResponse } from "next/server";
import { authorizeProfile } from "@/lib/session";
import { buildStats, dateRange } from "@/lib/stats";
import { MAX_RANGE_DAYS } from "@/lib/stats-types";

type Context = { params: Promise<{ id: string }> };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Estadísticas de un rango de fechas (startDate y endDate incluidas). */
export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeProfile(id);
  if (!auth.ok) return auth.response;

  const startDate = request.nextUrl.searchParams.get("startDate") ?? "";
  const endDate = request.nextUrl.searchParams.get("endDate") ?? "";
  if (!DATE_KEY.test(startDate) || !DATE_KEY.test(endDate) || startDate > endDate) {
    return NextResponse.json({ error: "Rango de fechas inválido." }, { status: 400 });
  }
  if (dateRange(startDate, endDate).length > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `El rango puede tener hasta ${MAX_RANGE_DAYS} días.` },
      { status: 400 }
    );
  }

  return NextResponse.json(await buildStats(auth.profile, startDate, endDate));
}
