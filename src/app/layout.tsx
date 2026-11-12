import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";
import { ChartIcon, FlameIcon } from "@/components/icons";
import { getSession } from "@/lib/session";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

// Títulos: serif con carácter (eje óptico, "SOFT" y cursiva propia). Nunito queda para el texto corrido.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
});

const DESCRIPTION =
  "Calcula tus calorías y macros según tu cuerpo y tu objetivo, y registra comidas, agua y suplementos en segundos.";
const SHARE_TITLE = "Calcount — Come con un plan, sin vivir contando";

export const metadata: Metadata = {
  metadataBase: new URL("https://calcount.ck-vs.com"),
  title: "Calcount — Conteo de calorías",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Calcount",
    locale: "es_ES",
    title: SHARE_TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: DESCRIPTION,
  },
};

const NAV_LINK =
  "rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-neutral-900">
        <header className="sticky top-0 z-20 border-b border-neutral-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md shadow-brand-600/30">
                <FlameIcon size={18} className="sm:size-5" />
              </span>
              <span className="font-display text-lg sm:text-xl font-semibold text-neutral-800">
                Calcount
              </span>
            </Link>
            {session ? (
              <div className="flex items-center gap-1 sm:gap-3">
                <nav className="flex items-center gap-0.5 sm:gap-1">
                  <Link href="/" className={NAV_LINK}>
                    Hoy
                  </Link>
                  <Link href="/stats" className={`${NAV_LINK} inline-flex items-center`} aria-label="Estadísticas">
                    <ChartIcon size={16} className="sm:hidden" />
                    <span className="hidden sm:inline">Estadísticas</span>
                  </Link>
                  <Link href="/foods" className={NAV_LINK}>
                    Alimentos
                  </Link>
                  <Link href="/faq" className={NAV_LINK} title="Preguntas frecuentes">
                    FAQ
                  </Link>
                </nav>
                <UserMenu name={session.user.name} email={session.user.email} />
              </div>
            ) : (
              <nav className="flex items-center gap-1 text-xs sm:text-sm sm:gap-2">
                <Link href="/faq" className={`${NAV_LINK} hidden sm:inline-flex`}>
                  Cómo calculamos
                </Link>
                <Link href="/login" className={NAV_LINK}>
                  Iniciar sesión
                </Link>
                <Link href="/signup" className="btn-primary px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">
                  Registrarse
                </Link>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-4 py-4 sm:py-6">{children}</main>
      </body>
    </html>
  );
}
