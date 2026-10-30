// Genera prisma/seed.sql con el catálogo global de alimentos (userId nulo).
// Uso: npm run db:seed:sql && npm run db:seed:local   (o db:seed:remote)
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const foods = [
  { name: "Arroz cocido", category: "Cereales y granos", icon: "🍚", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Papa cocida", category: "Tubérculos", icon: "🥔", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { name: "Lenteja cocida", category: "Leguminosas", icon: "🍲", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: "Caraota negra cocida", category: "Leguminosas", icon: "🫘", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5 },
  { name: "Quinoa cocida", category: "Cereales y granos", icon: "🌾", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9 },
  { name: "Avena en hojuelas", category: "Cereales y granos", icon: "🥣", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 389, protein: 13.2, carbs: 67.7, fat: 6.5 },
  { name: "Harina de maíz precocida", category: "Cereales y granos", icon: "🌽", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 365, protein: 7, carbs: 77, fat: 1.5 },
  { name: "Calabaza cocida", category: "Vegetales", icon: "🎃", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 20, protein: 0.7, carbs: 4.9, fat: 0.1 },
  { name: "Copos de maíz sin azúcar", category: "Cereales y granos", icon: "🥣", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 357, protein: 7, carbs: 84, fat: 0.4 },
  { name: "Copos de quinoa sin azúcar", category: "Cereales y granos", icon: "🥣", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 374, protein: 12, carbs: 68, fat: 6 },
  { name: "Carne de res magra cocida", category: "Carnes", icon: "🥩", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: "Cerdo (lomo cocido)", category: "Carnes", icon: "🥩", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 242, protein: 27, carbs: 0, fat: 14 },
  { name: "Merluza cocida", category: "Pescados y mariscos", icon: "🐟", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 90, protein: 19, carbs: 0, fat: 1.5 },
  { name: "Carne picada de res cocida", category: "Carnes", icon: "🥩", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 254, protein: 26, carbs: 0, fat: 17 },
  { name: "Fajitas", category: "Cereales y granos", icon: "🫓", servingUnit: "UNIT", foodType: "CARBOHIDRATOS", calories: 79, protein: 2.2, carbs: 13, fat: 2 },
  { name: "Proteína", category: "Suplementos", icon: "🥤", servingUnit: "UNIT", foodType: "PROTEINAS", calories: 134, protein: 25, carbs: 4, fat: 2 },
  { name: "Huevo", category: "Huevos y lácteos", icon: "🥚", servingUnit: "UNIT", foodType: "PROTEINAS", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: "Leche entera", category: "Huevos y lácteos", icon: "🥛", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: "Yogurt natural entero", category: "Huevos y lácteos", icon: "🥛", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  { name: "Maní tostado", category: "Frutos secos", icon: "🥜", servingUnit: "GRAMS_100", foodType: "GRASAS", calories: 567, protein: 26, carbs: 16, fat: 49 },
  { name: "Nueces", category: "Frutos secos", icon: "🌰", servingUnit: "GRAMS_100", foodType: "GRASAS", calories: 654, protein: 15, carbs: 14, fat: 65 },
  { name: "Almendras", category: "Frutos secos", icon: "🌰", servingUnit: "GRAMS_100", foodType: "GRASAS", calories: 579, protein: 21, carbs: 22, fat: 50 },
  { name: "Zanahoria cruda", category: "Vegetales", icon: "🥕", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
  { name: "Tomate", category: "Vegetales", icon: "🍅", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: "Lechuga", category: "Vegetales", icon: "🥬", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { name: "Cebolla", category: "Vegetales", icon: "🧅", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  { name: "Pepino", category: "Vegetales", icon: "🥒", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { name: "Trucha cocida", category: "Pescados y mariscos", icon: "🐟", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 168, protein: 23.8, carbs: 0, fat: 7.2 },
  { name: "Atún enlatado (en agua)", category: "Pescados y mariscos", icon: "🥫", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 116, protein: 25.5, carbs: 0, fat: 0.8 },
  { name: "Zucchini", category: "Vegetales", icon: "🥒", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { name: "Espárragos", category: "Vegetales", icon: "🌱", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
  { name: "Cebolla morada", category: "Vegetales", icon: "🧅", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  { name: "Batata cocida", category: "Vegetales", icon: "🍠", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 90, protein: 2, carbs: 20.7, fat: 0.2 },
  { name: "Yuca cocida", category: "Vegetales", icon: "🥔", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 160, protein: 1.4, carbs: 38, fat: 0.3 },
  { name: "Brócoli", category: "Vegetales", icon: "🥦", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  { name: "Coliflor", category: "Vegetales", icon: "🥦", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  { name: "Harina de avena", category: "Cereales y granos", icon: "🥣", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 404, protein: 14.7, carbs: 65.7, fat: 9.1 },
  { name: "Suprema de pollo cocida", category: "Carnes", icon: "🍗", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Palta", category: "Vegetales", icon: "🥑", servingUnit: "GRAMS_100", foodType: "GRASAS", calories: 150, protein: 2, carbs: 8.5, fat: 14.7 },
  { name: "Queso venezolano", category: "Huevos y lácteos", icon: "🧀", servingUnit: "GRAMS_100", foodType: "PROTEINAS", calories: 300, protein: 20, carbs: 2, fat: 23 },
  { name: "Queso crema", category: "Huevos y lácteos", icon: "🧀", servingUnit: "GRAMS_100", foodType: "GRASAS", calories: 342, protein: 6, carbs: 4, fat: 34 },
  { name: "Frutilla", category: "Frutas", icon: "🍓", servingUnit: "UNIT", foodType: "CARBOHIDRATOS", calories: 4, protein: 0.1, carbs: 0.9, fat: 0 },
  { name: "Banana", category: "Frutas", icon: "🍌", servingUnit: "UNIT", foodType: "CARBOHIDRATOS", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: "Manzana", category: "Frutas", icon: "🍎", servingUnit: "UNIT", foodType: "CARBOHIDRATOS", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: "Pera", category: "Frutas", icon: "🍐", servingUnit: "UNIT", foodType: "CARBOHIDRATOS", calories: 101, protein: 0.6, carbs: 27, fat: 0.2 },
  { name: "Durazno", category: "Frutas", icon: "🍑", servingUnit: "UNIT", foodType: "CARBOHIDRATOS", calories: 59, protein: 1.4, carbs: 14.3, fat: 0.4 },
  { name: "Ciruela", category: "Frutas", icon: "🟣", servingUnit: "UNIT", foodType: "CARBOHIDRATOS", calories: 30, protein: 0.5, carbs: 7.5, fat: 0.2 },
  { name: "Arándanos", category: "Frutas", icon: "🫐", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  { name: "Ananá", category: "Frutas", icon: "🍍", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 50, protein: 0.5, carbs: 13.1, fat: 0.1 },
  { name: "Naranja", category: "Frutas", icon: "🍊", servingUnit: "UNIT", foodType: "CARBOHIDRATOS", calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2 },
  { name: "Mandarina", category: "Frutas", icon: "🍊", servingUnit: "UNIT", foodType: "CARBOHIDRATOS", calories: 47, protein: 0.7, carbs: 11.7, fat: 0.3 },
  { name: "Aceitunas", category: "Encurtidos", icon: "🫒", servingUnit: "GRAMS_100", foodType: "GRASAS", calories: 115, protein: 0.8, carbs: 6.3, fat: 10.7 },
  { name: "Pepinillos", category: "Encurtidos", icon: "🥒", servingUnit: "GRAMS_100", foodType: "CARBOHIDRATOS", calories: 11, protein: 0.3, carbs: 2.3, fat: 0.2 },
] as const;

const sql = (v: string | number | null) =>
  v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`;

// Id determinista: permite re-ejecutar el seed sin duplicar (la unicidad
// [userId, name] no aplica a filas con userId nulo).
const slug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const statements = foods.map((f) => {
  const cols = ["id", "userId", "name", "category", "icon", "servingUnit", "foodType", "calories", "protein", "carbs", "fat"];
  const vals = [`global-${slug(f.name)}`, null, f.name, f.category, f.icon, f.servingUnit, f.foodType, f.calories, f.protein, f.carbs, f.fat];
  const updates = cols
    .filter((c) => c !== "id" && c !== "userId")
    .map((c) => `"${c}" = excluded."${c}"`)
    .join(", ");
  return `INSERT INTO "Food" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${vals.map(sql).join(", ")}) ON CONFLICT("id") DO UPDATE SET ${updates};`;
});

writeFileSync(join(__dirname, "seed.sql"), statements.join("\n") + "\n");
console.log(`seed.sql generado: ${foods.length} alimentos.`);
