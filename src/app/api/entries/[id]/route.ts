import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeUser } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  // deleteMany con el filtro de dueño: solo borra si el registro es del usuario.
  const { count } = await prisma.foodEntry.deleteMany({
    where: { id, profile: { userId: auth.user.id } },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
