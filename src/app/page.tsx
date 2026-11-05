import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "🎯",
    title: "Tu meta, calculada para ti",
    text: "Estimamos tu gasto diario con fórmulas reconocidas y tu nivel de actividad, y lo ajustamos a tu objetivo: bajar, mantener o subir.",
  },
  {
    icon: "🍽️",
    title: "Registro rápido por comida",
    text: "Carga desayuno, almuerzo, cena y meriendas desde un catálogo de alimentos o con los tuyos propios.",
  },
  {
    icon: "🍱",
    title: "Comidas guardadas",
    text: "¿Siempre desayunas lo mismo? Guárdalo una vez y cárgalo con un clic, ajustando cantidades si hace falta.",
  },
  {
    icon: "✨",
    title: "Autocompletar el día",
    text: "Dinos qué tienes para cenar y te proponemos cantidades para cerrar tus calorías o tus macros.",
  },
  {
    icon: "💧",
    title: "Hidratación y suplementos",
    text: "Marca los vasos de agua y los suplementos del día, y mira en la semana qué días cumpliste.",
  },
  {
    icon: "📈",
    title: "Se adapta a tu progreso",
    text: "Registra tu peso: con unas semanas de datos, la app corrige tu gasto real según cómo responde tu cuerpo.",
  },
];

const STEPS = [
  { title: "Crea tu cuenta", text: "Solo necesitas tu nombre, correo y una contraseña." },
  { title: "Completa tu perfil", text: "Edad, peso, altura, actividad y objetivo. Lo puedes cambiar cuando quieras." },
  { title: "Registra tu día", text: "Carga lo que comes y sigue tus calorías, macros y agua en tiempo real." },
];

function DayPreview() {
  const macros = [
    { label: "Proteína", value: 92, goal: 128, color: "#ff5d7a" },
    { label: "Carbohidratos", value: 160, goal: 210, color: "#4c8df6" },
    { label: "Grasa", value: 44, goal: 62, color: "#ffb020" },
  ];
  return (
    <div
      aria-hidden
      className="w-full max-w-sm rotate-1 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl shadow-brand-600/10"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Hoy</p>
      <p className="mt-1 text-sm text-neutral-500">Calorías restantes</p>
      <p className="text-4xl font-bold text-emerald-700">
        412 <span className="text-base font-normal text-neutral-500">kcal</span>
      </p>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full w-[79%] rounded-full bg-emerald-500" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {macros.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs">
              <span className="text-neutral-700">{m.label}</span>
              <span className="text-neutral-500">
                {m.value} / {m.goal} g
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${(m.value / m.goal) * 100}%`, backgroundColor: m.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 text-sm">
        <span className="font-semibold text-sky-700">💧 1.75 / 2.45 L</span>
        <span className="text-xs text-emerald-700">💊 ✓ Suplementos</span>
      </div>
    </div>
  );
}

export default async function HomePage() {
  // Con sesión, la home solo decide a dónde enviar al usuario.
  const session = await getSession();
  if (session) {
    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
    redirect(profile ? `/profiles/${profile.id}` : "/profiles/new");
  }

  return (
    <div className="flex flex-col gap-16 py-4 sm:py-8">
      <section className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-5">
          <span className="self-start rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Conteo de calorías simple y sin complicaciones
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
            Come con un plan, <span className="text-brand-600">sin vivir contando</span>.
          </h1>
          <p className="text-lg text-neutral-600">
            Calcount calcula cuántas calorías y macros necesitas según tu cuerpo y tu objetivo, y te
            ayuda a registrar tu día en segundos: comidas, agua y suplementos en un solo lugar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary">
              Crear cuenta gratis
            </Link>
            <Link href="/login" className="btn-secondary">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <DayPreview />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center font-display text-2xl font-semibold">Todo lo que necesitas para tu día</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-2 font-semibold text-neutral-800">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center font-display text-2xl font-semibold">Empieza en 3 pasos</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3 rounded-xl bg-lagoon-50 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lagoon-500 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-lagoon-900">{step.title}</h3>
                <p className="mt-1 text-sm text-lagoon-700">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 px-6 py-10 text-center text-white">
        <h2 className="font-display text-2xl font-semibold">¿Listo para empezar?</h2>
        <p className="max-w-md text-brand-50">
          Crea tu cuenta y en unos minutos tendrás tu meta diaria de calorías, macros e hidratación.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-md hover:bg-brand-50"
          >
            Registrarme
          </Link>
          <Link
            href="/faq"
            className="rounded-full border border-white/60 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
          >
            Ver preguntas frecuentes
          </Link>
        </div>
      </section>

      <p className="text-center text-xs text-neutral-500">
        Calcount es una herramienta de apoyo y no reemplaza la indicación de un profesional de la salud.
      </p>
    </div>
  );
}
