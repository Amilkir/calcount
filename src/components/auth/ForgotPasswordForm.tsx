"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { inputClass, primaryButtonClass } from "@/components/auth/AuthShell";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setPending(false);
    // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-neutral-600">
        Si existe una cuenta con <strong>{email}</strong>, te enviamos un enlace para
        restablecer la contraseña.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Correo
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </button>
      <Link href="/login" className="text-center text-sm text-neutral-500 hover:underline">
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
