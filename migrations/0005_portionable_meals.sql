-- Comidas porcionables: la receta indica cuántas porciones rinde.
ALTER TABLE "MealTemplate" ADD COLUMN "servings" INTEGER;

-- Registro de porciones de una comida porcionable, con sus macros guardados.
ALTER TABLE "FoodEntry" ADD COLUMN "portions" REAL;
ALTER TABLE "FoodEntry" ADD COLUMN "icon" TEXT;
ALTER TABLE "FoodEntry" ADD COLUMN "protein" REAL;
ALTER TABLE "FoodEntry" ADD COLUMN "carbs" REAL;
ALTER TABLE "FoodEntry" ADD COLUMN "fat" REAL;
