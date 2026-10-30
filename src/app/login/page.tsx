import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/auth/AuthForm";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSession()) redirect("/");
  return (
    <AuthShell title="Iniciar sesión" subtitle="Accede a tu registro de calorías">
      <AuthForm mode="login" />
    </AuthShell>
  );
}
