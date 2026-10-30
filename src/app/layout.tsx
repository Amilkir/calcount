import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";
import { getSession } from "@/lib/session";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Calcount — Conteo de calorías",
  description: "Lleva el registro diario de tus calorías por comida",
};

const NAV_LINK =
  "rounded-full px-3 py-1.5 font-semibold text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-neutral-900">
        <header className="sticky top-0 z-20 border-b border-neutral-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg shadow-md shadow-brand-600/30">
                🔥
              </span>
              <span className="font-display text-xl font-semibold text-neutral-800">
                Calcount
              </span>
            </Link>
            {session && (
              <div className="flex items-center gap-1 sm:gap-3">
                <nav className="flex items-center gap-0.5 text-sm sm:gap-1">
                  <Link href="/" className={NAV_LINK}>
                    Hoy
                  </Link>
                  <Link href="/profile" className={NAV_LINK}>
                    Perfil
                  </Link>
                  <Link href="/foods" className={NAV_LINK}>
                    Alimentos
                  </Link>
                </nav>
                <UserMenu email={session.user.email} />
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
