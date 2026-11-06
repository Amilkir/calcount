import { CapsuleIcon, CheckIcon, DropIcon } from "@/components/icons";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "Tu meta, calculada para ti",
    text: "Estimamos tu gasto diario con fórmulas reconocidas y tu nivel de actividad, y lo ajustamos a tu objetivo: bajar, mantener o subir.",
  },
  {
    title: "Registro rápido por comida",
    text: "Carga desayuno, almuerzo, cena y meriendas desde un catálogo de alimentos o con los tuyos propios.",
  },
  {
    title: "Comidas guardadas",
    text: "¿Siempre desayunas lo mismo? Guárdalo una vez y cárgalo con un clic, ajustando cantidades si hace falta.",
  },
  {
    title: "Autocompletar el día",
    text: "Dinos qué tienes para cenar y te proponemos cantidades para cerrar tus calorías o tus macros.",
  },
  {
    title: "Hidratación y suplementos",
    text: "Marca los vasos de agua y los suplementos del día, y mira en la semana qué días cumpliste.",
  },
  {
    title: "Se adapta a tu progreso",
    text: "Registra tu peso: con unas semanas de datos, la app corrige tu gasto real según cómo responde tu cuerpo.",
  },
];

function DayPreview() {
  const macros = [
    { label: "Proteína", value: 92, goal: 128, color: "var(--color-protein)" },
    { label: "Carbohidratos", value: 160, goal: 210, color: "var(--color-carbs)" },
    { label: "Grasa", value: 44, goal: 62, color: "var(--color-fat)" },
  ];
  return (
    <div
      aria-hidden
      className="w-full max-w-sm rotate-1 rounded-lg border border-neutral-200 bg-white p-5 shadow-xl shadow-brand-600/10"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Hoy</p>
      <p className="mt-1 text-sm text-neutral-500">Calorías restantes</p>
      <p className="text-4xl font-bold text-lagoon-700">
        412 <span className="text-base font-normal text-neutral-500">kcal</span>
      </p>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full w-[79%] rounded-full bg-lagoon-500" />
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
      <div className="mt-4 flex items-center justify-between rounded-md bg-water-50 px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-water-700">
          <DropIcon className="text-water-500" /> 1.75 / 2.45 L
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-lagoon-700">
          <CapsuleIcon size={14} /> <CheckIcon size={12} /> Suplementos
        </span>
      </div>
    </div>
  );
}

/** El autocompletado como aparece en la app: lo que tienes, y los gramos que cierran el día. */
function AutofillPreview() {
  const items = [
    { name: "Pechuga de pollo", grams: 150, kcal: 248 },
    { name: "Arroz cocido", grams: 90, kcal: 117 },
    { name: "Palta", grams: 30, kcal: 48 },
  ];
  return (
    <div aria-hidden className="w-full rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-baseline justify-between border-b border-neutral-100 px-5 py-3">
        <p className="font-semibold text-neutral-800">Cena</p>
        <p className="text-xs text-neutral-500">Te quedan 412 kcal</p>
      </div>
      <ul className="divide-y divide-neutral-100 px-5">
        {items.map((it) => (
          <li key={it.name} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-neutral-700">{it.name}</span>
            <span className="tabular-nums text-neutral-500">
              <strong className="font-semibold text-neutral-900">{it.grams} g</strong> · {it.kcal} kcal
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-neutral-100 bg-lagoon-50 px-5 py-3 text-sm">
        <span className="font-semibold text-lagoon-900">Total propuesto</span>
        <span className="font-semibold tabular-nums text-lagoon-700">413 / 412 kcal</span>
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
    <div className="flex flex-col gap-20 py-4 sm:py-8">
      <section className="grid items-center gap-10 md:grid-cols-[1.25fr_1fr]">
        <div className="flex flex-col gap-5">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] text-neutral-900 sm:text-[3.25rem]">
            Come con un plan, <em className="text-brand-600">sin vivir contando</em>.
          </h1>
          <p className="max-w-xl text-lg text-neutral-600">
            Calcount calcula cuántas calorías y macros necesitas según tu cuerpo y tu objetivo, y te
            ayuda a registrar tu día en segundos: comidas, agua y suplementos en un solo lugar.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/signup" className="btn-primary">
              Crear cuenta gratis
            </Link>
            <Link href="/login" className="text-sm font-semibold text-neutral-600 hover:text-brand-700">
              Ya tengo cuenta →
            </Link>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <DayPreview />
        </div>
      </section>

      <section className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
        <AutofillPreview />
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Dinos qué hay para cenar. Nosotros ponemos los gramos.
          </h2>
          <p className="text-neutral-600">
            Eliges los alimentos que tienes a mano y Calcount propone cantidades enteras que cierran
            justo tus calorías del día, o una segunda opción que prioriza tus macros y te avisa cuánto
            te pasarías.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight">
          Del desayuno a la balanza, sin hojas de cálculo.
        </h2>
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="border-t-2 border-neutral-900 pt-3">
              <dt className="font-display text-lg font-semibold text-neutral-900">{f.title}</dt>
              <dd className="mt-1 text-sm text-neutral-600">{f.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col items-start gap-4 border-t border-neutral-200 pt-10">
        <h2 className="font-display text-3xl font-semibold leading-tight">
          Tu meta del día, en lo que tarda el café.
        </h2>
        <p className="max-w-lg text-neutral-600">
          Edad, peso, altura, actividad y objetivo: con eso tienes tus calorías, macros e hidratación.
          Y si quieres ver cómo hacemos las cuentas,{" "}
          <Link href="/faq" className="font-semibold text-brand-700 hover:underline">
            están todas explicadas
          </Link>
          .
        </p>
        <Link href="/signup" className="btn-primary">
          Calcular mi meta
        </Link>
      </section>

      <p className="text-xs text-neutral-500">
        Calcount es una herramienta de apoyo y no reemplaza la indicación de un profesional de la salud.
      </p>
    </div>
  );
}
