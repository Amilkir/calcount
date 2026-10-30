import type { Food, FoodEntry, Profile } from "@/generated/prisma/client";

export type { Food, Profile };
export type FoodEntryWithFood = FoodEntry & { food: Food | null };
