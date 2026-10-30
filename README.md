# Calcount

App local para llevar el registro diario de calorías: perfiles con sexo, edad,
altura, peso y tipo de cuerpo; una base de datos de alimentos editable; y un
contador de calorías restantes por día repartido en 5 ingestas (desayuno,
almuerzo, cena, merienda, adicional).

## Cómo correr el proyecto

```bash
npm install
npx prisma migrate deploy   # crea/actualiza dev.db con el esquema
npm run db:seed             # carga los 25 alimentos base (idempotente)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

> Usa siempre `npm run dev` para uso normal (no `npm run build && npm run start`
> salvo que sepas lo que haces): es una app local, pensada para correr en modo
> desarrollo.

## Cálculo de calorías

- BMR con la fórmula de Mifflin-St Jeor.
- TDEE = BMR × multiplicador de nivel de actividad.
- Ajuste por tipo de cuerpo: ectomorfo ×1.05, mesomorfo ×1.0, endomorfo ×0.95.
- Meta de déficit = mantenimiento × 0.8 (20% de déficit).

Ver [src/lib/calories.ts](src/lib/calories.ts).

## Base de datos

SQLite local (`dev.db`, ignorado por git) vía Prisma con el adaptador
`@prisma/adapter-libsql`. Esquema en [prisma/schema.prisma](prisma/schema.prisma).

- `Profile`: datos del usuario + meta (mantenimiento/déficit).
- `Food`: alimentos con calorías por 100 g o por unidad (ej. huevo).
- `FoodEntry`: cada registro de consumo, con las calorías ya calculadas al
  momento de guardarse (para no alterar el historial si luego cambias el
  valor calórico de un alimento).

Para agregar/editar alimentos base, edita [prisma/seed.ts](prisma/seed.ts) y
vuelve a correr `npm run db:seed` (usa `upsert`, no duplica). También puedes
agregar alimentos nuevos directamente desde la app en `/foods`.
