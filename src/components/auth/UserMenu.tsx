"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function UserMenu({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-xs text-neutral-500 lg:inline">{email}</span>
      <button
        onClick={handleSignOut}
        className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
      >
        Salir
      </button>
    </div>
  );
}
