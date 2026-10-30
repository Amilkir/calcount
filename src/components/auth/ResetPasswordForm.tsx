"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { inputClass, primaryButtonClass } from "@/components/auth/AuthShell";

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!token || params.get("error")) {
    return (
      <div className="flex flex-col gap-3 text-center text-sm text-neutral-600">
        <p>El enlace no es válido o ya venció.</p>
        <Link href="/forgot-password" className="font-semibold text-brand-700 hover:underline">
          Solicitar uno nuevo
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Nueva contraseña
        <input
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
