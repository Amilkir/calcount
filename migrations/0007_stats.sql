-- Preferencia del perfil: mostrar el gráfico de evolución del peso en Estadísticas.
ALTER TABLE "Profile" ADD COLUMN "showWeightChart" BOOLEAN NOT NULL DEFAULT false;

-- Metas vigentes cada día (sin el extra por deporte), para las estadísticas.
ALTER TABLE "DailyLog" ADD COLUMN "goalCalories" REAL;
ALTER TABLE "DailyLog" ADD COLUMN "proteinG" REAL;
ALTER TABLE "DailyLog" ADD COLUMN "carbsG" REAL;
ALTER TABLE "DailyLog" ADD COLUMN "fatG" REAL;
