"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { inputClass, primaryButtonClass } from "@/components/auth/AuthShell";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    if (mode === "signup") {
      const { error } = await authClient.signUp.email({
        name: name.trim(),
        email,
        password,
        callbackURL: "/",
      });
      setPending(false);
      if (error) return setError(authErrorMessage(error));
      setSentTo(email);
      return;
    }

    const { error } = await authClient.signIn.email({ email, password, callbackURL: "/" });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    router.push("/");
    router.refresh();
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    if (error) setError(authErrorMessage(error));
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-3 text-center text-sm text-neutral-600">
        <p className="text-3xl">📬</p>
        <p className="font-medium text-neutral-900">Revisa tu correo</p>
        <p>
          Enviamos un enlace de confirmación a <strong>{sentTo}</strong>. Ábrelo para activar
          tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={handleGoogle}
        className="btn-secondary w-full"
      >
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />o<span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
        )}
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
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Un momento…" : mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </form>

      <div className="flex flex-col gap-1 text-center text-sm text-neutral-500">
        {mode === "login" && (
          <Link href="/forgot-password" className="hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        )}
        {mode === "login" ? (
          <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
            Crear una cuenta
          </Link>
        ) : (
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Ya tengo cuenta
          </Link>
        )}
      </div>
    </div>
  );
}
