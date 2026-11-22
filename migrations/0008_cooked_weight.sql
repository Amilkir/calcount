-- Peso total de una comida porcionable ya cocida (en gramos). Los ingredientes se pesan crudos;
-- con este peso se puede cargar lo comido en gramos cocidos y saber cuánto pesa cada porción.
ALTER TABLE "MealTemplate" ADD COLUMN "cookedWeight" REAL;
