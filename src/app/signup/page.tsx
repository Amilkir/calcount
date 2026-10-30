import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/auth/AuthForm";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getSession()) redirect("/");
  return (
    <AuthShell title="Crear cuenta" subtitle="Tus datos quedan asociados a tu cuenta">
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
