import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviaremos un enlace por correo">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
