"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

const ITEM_CLASS =
  "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-neutral-700 hover:bg-brand-50 hover:text-brand-700";

export default function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Se cierra al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const displayName = name.trim() || email;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-neutral-300 py-1 pl-1 pr-2 sm:pr-3 text-xs sm:text-sm font-semibold text-neutral-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold uppercase text-brand-700">
          {displayName.charAt(0)}
        </span>
        <span className="hidden sm:inline-block max-w-28 truncate sm:max-w-40">{displayName}</span>
        <span aria-hidden className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
        >
          <p className="truncate border-b border-neutral-100 px-4 py-2 text-xs text-neutral-500">
            {email}
          </p>
          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={ITEM_CLASS}>
            👤 Perfil
          </Link>
          <button type="button" role="menuitem" onClick={handleSignOut} className={ITEM_CLASS}>
            🚪 Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
