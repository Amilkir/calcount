-- Deportes del perfil (aparte del entrenamiento regular) y deportes hechos cada día.
ALTER TABLE "Profile" ADD COLUMN "sports" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "DailyLog" ADD COLUMN "sportsDone" TEXT NOT NULL DEFAULT '[]';

-- "Deportes de equipo" deja de ser un tipo de entrenamiento. En el modo detallado se pasa
-- a la lista de deportes con la misma duración y frecuencia; en el simple no se usaba.
UPDATE "Profile"
SET "sports" = json_array(json_object(
      'sport', 'OTHER',
      'minutes', COALESCE("workoutMinutes", 60),
      'perWeek', COALESCE("workoutsPerWeek", 1)
    )),
    "workoutType" = 'STRENGTH',
    "workoutsPerWeek" = NULL,
    "workoutMinutes" = NULL
WHERE "workoutType" = 'SPORTS' AND "activityMode" = 'DETAILED';

UPDATE "Profile" SET "workoutType" = 'OTHER' WHERE "workoutType" = 'SPORTS';
