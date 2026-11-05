import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Preguntas frecuentes — Calcount",
  description: "Cómo calcula Calcount tus calorías, macros e hidratación, y de dónde salen sus datos.",
};

interface Faq {
  q: string;
  a: React.ReactNode;
}

const SECTIONS: { title: string; items: Faq[] }[] = [
  {
    title: "Calorías y cálculos",
    items: [
      {
        q: "¿Cómo se calculan las calorías que necesita mi cuerpo?",
        a: (
          <>
            <p>Se hace en tres pasos:</p>
            <ol className="ml-5 list-decimal space-y-1">
              <li>
                <strong>Metabolismo basal (BMR):</strong> lo que gastas en reposo. Por defecto se usa
                Mifflin-St Jeor (peso, altura, edad y sexo). Si conoces tu % de grasa, o lo estimamos con
                las medidas de cuello y cintura, se usa Katch-McArdle, que parte de tu masa magra.
                También puedes elegir Harris-Benedict.
              </li>
              <li>
                <strong>Gasto total (TDEE):</strong> el BMR multiplicado por tu nivel de actividad (de
                1,2 a 1,9). En el modo detallado se suman por separado tu actividad diaria, los pasos por
                encima de 3 000 y las calorías de tus entrenamientos.
              </li>
              <li>
                <strong>Meta según tu objetivo:</strong> mantenimiento = tu gasto total; déficit = 20 %
                menos (o el ritmo semanal que elijas); superávit = 10 % más. Por seguridad, el déficit no
                baja de 1 500 kcal en hombres ni de 1 200 kcal en mujeres (salvo que tu mantenimiento ya
                sea menor).
              </li>
            </ol>
            <p>
              También se consideran el embarazo, la lactancia y las condiciones de tiroides. En tu perfil
              ves el detalle de cada número.
            </p>
          </>
        ),
      },
      {
        q: "¿Cómo se reparten mis macros (proteína, carbohidratos y grasa)?",
        a: (
          <p>
            La proteína y la grasa se fijan en gramos por kilo de peso según la distribución que elijas
            (por ejemplo, la balanceada usa 1,6 g de proteína y 0,9 g de grasa por kg). Las calorías que
            sobran de tu meta se asignan a carbohidratos. Cada gramo de proteína o carbohidrato aporta
            4 kcal y cada gramo de grasa, 9 kcal.
          </p>
        ),
      },
      {
        q: "¿Cómo se calcula la hidratación recomendada?",
        a: (
          <p>
            Partimos de 35 ml de agua por kilo de peso. Sumamos 500 ml por cada hora de ejercicio diario
            (en promedio semanal), 500 ml si vives en clima caluroso, 300 ml durante el embarazo y
            700 ml en la lactancia. El resultado se redondea a múltiplos de 50 ml. Incluye toda el agua
            que bebes; el agua de los alimentos es un extra.
          </p>
        ),
      },
      {
        q: "¿Qué es el ajuste dinámico?",
        a: (
          <p>
            Las fórmulas son estimaciones. Si activas el ajuste dinámico y registras tu peso y tus
            comidas (con al menos 4 pesos repartidos en 2 semanas o más dentro de los últimos 28 días, y
            comidas cargadas la mayoría de esos días), la app compara cuánto comiste con cuánto cambió tu peso y corrige tu mantenimiento según tu
            gasto real. El ajuste nunca supera ±25 % respecto a la fórmula.
          </p>
        ),
      },
      {
        q: "¿Cómo funciona el autocompletado de calorías?",
        a: (
          <p>
            Al agregar alimentos a una comida, en la pestaña «Completar» eliges lo que tienes disponible
            y la app te propone dos opciones con cantidades enteras: una que completa exactamente las
            calorías que te quedan, y otra que busca completar la proteína, los carbohidratos y la grasa
            del día, avisándote si con ella te pasas de calorías y por cuánto.
          </p>
        ),
      },
    ],
  },
  {
    title: "Alimentos y nutrición",
    items: [
      {
        q: "¿De dónde salen las calorías de los alimentos precargados?",
        a: (
          <p>
            Los valores del catálogo provienen de{" "}
            <a
              href="https://fdc.nal.usda.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 hover:underline"
            >
              USDA FoodData Central
            </a>
            , la base de datos de composición de alimentos del Departamento de Agricultura de EE. UU.
            Son valores promedio por 100 g o por unidad, y pueden variar según la marca, la variedad y
            la forma de preparación. Si un producto que consumes es distinto, puedes crear tu propio
            alimento con los datos de su etiqueta.
          </p>
        ),
      },
      {
        q: "¿Qué función cumplen las proteínas, los carbohidratos y las grasas?",
        a: (
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Proteínas:</strong> construyen y reparan músculos y tejidos, y forman enzimas y
              hormonas. Además, son las que más saciedad dan.
            </li>
            <li>
              <strong>Carbohidratos:</strong> son la fuente de energía principal y más rápida, sobre todo
              para el cerebro y el ejercicio intenso. La fibra, que también es un carbohidrato, ayuda a la
              digestión.
            </li>
            <li>
              <strong>Grasas:</strong> son energía de reserva, permiten absorber las vitaminas A, D, E y K,
              y son necesarias para producir hormonas y mantener las células.
            </li>
          </ul>
        ),
      },
      {
        q: "¿Debo pesar los alimentos cocidos o crudos?",
        a: (
          <p>
            Pésalos en el mismo estado en que está cargado el alimento: «Arroz cocido» se pesa cocido y
            «Avena en hojuelas», seca. Al cocinar, los alimentos ganan o pierden agua y su peso cambia
            mucho, así que mezclar estados es la causa de error más común.
          </p>
        ),
      },
      {
        q: "¿Por qué algunos alimentos dicen que sus macros son estimados?",
        a: (
          <p>
            Si un alimento propio no tiene proteína, carbohidratos y grasa cargados, la app asigna todas
            sus calorías a su tipo principal (por ejemplo, «Proteínas»). Para que tus macros sean más
            precisos, completa esos datos al crear el alimento.
          </p>
        ),
      },
    ],
  },
  {
    title: "Uso de la app",
    items: [
      {
        q: "Cumplo mis calorías, pero mi peso no baja. ¿Por qué?",
        a: (
          <p>
            El peso varía de un día a otro por agua, sal, digestión y ciclo hormonal, así que fíjate en la
            tendencia de 2 a 3 semanas. También es común subestimar porciones, aceites o bebidas. Si el
            estancamiento sigue, activa el ajuste dinámico para que la meta se corrija con tus datos
            reales.
          </p>
        ),
      },
      {
        q: "¿Mis datos son privados?",
        a: (
          <p>
            Sí. Tu perfil, tus registros, tus alimentos propios y tus comidas guardadas solo son visibles
            para tu cuenta. El catálogo de alimentos precargados es común a todos los usuarios.
          </p>
        ),
      },
      {
        q: "¿Calcount reemplaza a un nutricionista o médico?",
        a: (
          <p>
            No. Los cálculos son estimaciones basadas en fórmulas de uso general y sirven como guía. Si
            tienes una condición de salud, estás embarazada, en lactancia o tienes un objetivo exigente,
            consulta a un profesional.
          </p>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Preguntas frecuentes</h1>
        <p className="text-sm text-neutral-500">
          Cómo calculamos tus números y de dónde salen los datos.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {section.title}
          </h2>
          <div className="flex flex-col divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            {section.items.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-neutral-800 hover:bg-neutral-50 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-brand-600 transition-transform group-open:rotate-45"
                  >
                    ＋
                  </span>
                </summary>
                <div className="flex flex-col gap-2 px-5 pb-5 text-sm leading-relaxed text-neutral-600">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <p className="text-sm text-neutral-500">
        ¿No encontraste tu respuesta? Revisa el detalle de tus cálculos en tu{" "}
        <Link href="/profile" className="font-semibold text-brand-700 hover:underline">
          perfil
        </Link>
        .
      </p>
    </div>
  );
}
