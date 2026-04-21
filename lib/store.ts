import AsyncStorage from "@react-native-async-storage/async-storage";
import { FoodItem } from "./food-database";
import { ExerciseItem } from "./exercise-database";

// ===================== TYPES =====================

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
export const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export interface FoodLogEntry {
  id: string;
  foodId: string;
  foodName: string;
  mealType: MealType;
  servingGrams: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  timestamp: number;
  date: string; // YYYY-MM-DD
}

export interface ExerciseLogEntry {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: string;
  durationMinutes: number;
  caloriesBurned: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface WeightEntry {
  id: string;
  weight: number; // in user's preferred unit
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface WaterEntry {
  date: string; // YYYY-MM-DD
  cups: number;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose" | "maintain" | "gain";
  calorieGoal: number;
  proteinGoal: number; // grams
  carbsGoal: number; // grams
  fatGoal: number; // grams
  waterGoal: number; // cups
  unitSystem: "metric" | "imperial";
  onboardingComplete: boolean;
  hasSeenDisclaimer: boolean;
}

export interface CustomFood extends FoodItem {
  isCustom: true;
}

// ─── Meal Templates ───────────────────────────────────────────────────────────

export interface MealTemplateEntry {
  foodId: string;
  foodName: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  entries: MealTemplateEntry[];
  totalCalories: number;
  createdAt: number;
}

// ===================== STORAGE KEYS =====================
const KEYS = {
  PROFILE: "calorly_profile",
  FOOD_LOG: "calorly_food_log",
  EXERCISE_LOG: "calorly_exercise_log",
  WEIGHT_LOG: "calorly_weight_log",
  WATER_LOG: "calorly_water_log",
  CUSTOM_FOODS: "calorly_custom_foods",
  RECENT_FOODS: "calorly_recent_foods",
  MEAL_TEMPLATES: "calorly_meal_templates",
};

// ===================== NUTRITION CALCULATIONS =====================

export function calculateTDEE(profile: Partial<UserProfile>): number {
  const { age = 30, gender = "male", heightCm = 170, weightKg = 70, activityLevel = "moderate" } = profile;
  
  // Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * activityMultipliers[activityLevel]);
}

export function calculateCalorieGoal(profile: Partial<UserProfile>): number {
  const tdee = calculateTDEE(profile);
  const goal = profile.goal || "maintain";
  if (goal === "lose") return Math.max(1200, tdee - 500);
  if (goal === "gain") return tdee + 300;
  return tdee;
}

export function calculateBMR(profile: Partial<UserProfile>): number {
  const { age = 30, gender = "male", heightCm = 170, weightKg = 70 } = profile;
  // Mifflin-St Jeor Equation (most accurate for general population)
  if (gender === "male") {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "High BMI (Class I)";
  return "High BMI (Class II+)";
}

export function getBMIDetail(bmi: number): {
  category: string;
  color: string;
  description: string;
  advice: string;
  range: string;
} {
  if (bmi < 18.5) return {
    category: "Underweight",
    color: "#3B82F6",
    description: "Your BMI is below the healthy range.",
    advice: "Consider increasing calorie intake with nutrient-dense foods and consult a healthcare provider.",
    range: "< 18.5",
  };
  if (bmi < 25) return {
    category: "Normal weight",
    color: "#22C55E",
    description: "Your BMI is within the healthy range.",
    advice: "Great work! Maintain your current habits with balanced nutrition and regular activity.",
    range: "18.5 – 24.9",
  };
  if (bmi < 30) return {
    category: "Overweight",
    color: "#F59E0B",
    description: "Your BMI is above the healthy range.",
    advice: "A modest calorie deficit combined with regular exercise can help reach a healthier range.",
    range: "25 – 29.9",
  };
  if (bmi < 35) return {
    category: "High BMI (Class I)",
    color: "#EF4444",
    description: "Your BMI is in the higher range. This is a screening indicator, not a diagnosis.",
    advice: "Consider speaking with a healthcare professional for personalised guidance. Small, sustainable changes can make a meaningful difference over time.",
    range: "30 – 34.9",
  };
  return {
    category: "High BMI (Class II+)",
    color: "#B91C1C",
    description: "Your BMI is in the higher range. This is a screening indicator, not a diagnosis.",
    advice: "We recommend consulting a qualified healthcare professional for personalised advice and support.",
    range: "≥ 35",
  };
}

export const ACTIVITY_LABELS: Record<UserProfile["activityLevel"], { label: string; description: string; multiplier: number }> = {
  sedentary:   { label: "Sedentary",    description: "Little or no exercise, desk job",              multiplier: 1.2   },
  light:       { label: "Lightly active",description: "Light exercise 1–3 days/week",              multiplier: 1.375 },
  moderate:    { label: "Moderately active", description: "Moderate exercise 3–5 days/week",        multiplier: 1.55  },
  active:      { label: "Very active",   description: "Hard exercise 6–7 days/week",               multiplier: 1.725 },
  very_active: { label: "Extra active",  description: "Very hard exercise, physical job or 2× training", multiplier: 1.9 },
};

export function calculateMacroGoals(calorieGoal: number, goal: string): { protein: number; carbs: number; fat: number } {
  // Balanced macro split: 30% protein, 40% carbs, 30% fat
  if (goal === "lose") {
    return {
      protein: Math.round((calorieGoal * 0.35) / 4),
      carbs: Math.round((calorieGoal * 0.35) / 4),
      fat: Math.round((calorieGoal * 0.30) / 9),
    };
  }
  if (goal === "gain") {
    return {
      protein: Math.round((calorieGoal * 0.30) / 4),
      carbs: Math.round((calorieGoal * 0.45) / 4),
      fat: Math.round((calorieGoal * 0.25) / 9),
    };
  }
  return {
    protein: Math.round((calorieGoal * 0.30) / 4),
    carbs: Math.round((calorieGoal * 0.40) / 4),
    fat: Math.round((calorieGoal * 0.30) / 9),
  };
}

export function calculateNutritionForServing(food: FoodItem, servingGrams: number) {
  const ratio = servingGrams / 100;
  return {
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    fiber: food.fiber ? Math.round(food.fiber * ratio * 10) / 10 : undefined,
    sugar: food.sugar ? Math.round(food.sugar * ratio * 10) / 10 : undefined,
    sodium: food.sodium ? Math.round(food.sodium * ratio) : undefined,
  };
}

// ===================== DATE UTILITIES =====================

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  if (dateStr === today) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===================== PROFILE =====================

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  age: 25,
  gender: "male",
  heightCm: 170,
  weightKg: 70,
  activityLevel: "moderate",
  goal: "maintain",
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 67,
  waterGoal: 8,
  unitSystem: "metric",
  onboardingComplete: false,
  hasSeenDisclaimer: false,
};

export async function loadProfile(): Promise<UserProfile> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROFILE);
    if (data) return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
  } catch {}
  return { ...DEFAULT_PROFILE };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

// ===================== FOOD LOG =====================

export async function loadFoodLog(date: string): Promise<FoodLogEntry[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FOOD_LOG);
    if (data) {
      const all: FoodLogEntry[] = JSON.parse(data);
      return all.filter((e) => e.date === date);
    }
  } catch {}
  return [];
}

export async function loadAllFoodLog(): Promise<FoodLogEntry[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FOOD_LOG);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export async function addFoodLogEntry(entry: Omit<FoodLogEntry, "id" | "timestamp">): Promise<FoodLogEntry> {
  const all = await loadAllFoodLog();
  const newEntry: FoodLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: Date.now(),
  };
  all.push(newEntry);
  await AsyncStorage.setItem(KEYS.FOOD_LOG, JSON.stringify(all));
  await addRecentFood(entry.foodId);
  return newEntry;
}

export async function deleteFoodLogEntry(id: string): Promise<void> {
  const all = await loadAllFoodLog();
  const filtered = all.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEYS.FOOD_LOG, JSON.stringify(filtered));
}

export async function updateFoodLogEntry(id: string, updates: Partial<FoodLogEntry>): Promise<void> {
  const all = await loadAllFoodLog();
  const idx = all.findIndex((e) => e.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    await AsyncStorage.setItem(KEYS.FOOD_LOG, JSON.stringify(all));
  }
}

// ===================== EXERCISE LOG =====================

export async function loadExerciseLog(date: string): Promise<ExerciseLogEntry[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.EXERCISE_LOG);
    if (data) {
      const all: ExerciseLogEntry[] = JSON.parse(data);
      return all.filter((e) => e.date === date);
    }
  } catch {}
  return [];
}

export async function loadAllExerciseLog(): Promise<ExerciseLogEntry[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.EXERCISE_LOG);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export async function addExerciseLogEntry(entry: Omit<ExerciseLogEntry, "id" | "timestamp">): Promise<ExerciseLogEntry> {
  const all = await loadAllExerciseLog();
  const newEntry: ExerciseLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: Date.now(),
  };
  all.push(newEntry);
  await AsyncStorage.setItem(KEYS.EXERCISE_LOG, JSON.stringify(all));
  return newEntry;
}

export async function deleteExerciseLogEntry(id: string): Promise<void> {
  const all = await loadAllExerciseLog();
  const filtered = all.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEYS.EXERCISE_LOG, JSON.stringify(filtered));
}

// ===================== WEIGHT LOG =====================

export async function loadWeightLog(): Promise<WeightEntry[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.WEIGHT_LOG);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export async function addWeightEntry(weight: number, date: string): Promise<WeightEntry> {
  const all = await loadWeightLog();
  const existing = all.findIndex((e) => e.date === date);
  const newEntry: WeightEntry = { id: generateId(), weight, date, timestamp: Date.now() };
  if (existing !== -1) {
    all[existing] = newEntry;
  } else {
    all.push(newEntry);
  }
  all.sort((a, b) => a.date.localeCompare(b.date));
  await AsyncStorage.setItem(KEYS.WEIGHT_LOG, JSON.stringify(all));
  return newEntry;
}

// ===================== WATER LOG =====================

export async function loadWaterEntry(date: string): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(KEYS.WATER_LOG);
    if (data) {
      const all: WaterEntry[] = JSON.parse(data);
      const entry = all.find((e) => e.date === date);
      return entry?.cups || 0;
    }
  } catch {}
  return 0;
}

export async function updateWaterEntry(date: string, cups: number): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.WATER_LOG);
    const all: WaterEntry[] = data ? JSON.parse(data) : [];
    const idx = all.findIndex((e) => e.date === date);
    if (idx !== -1) {
      all[idx].cups = cups;
    } else {
      all.push({ date, cups });
    }
    await AsyncStorage.setItem(KEYS.WATER_LOG, JSON.stringify(all));
  } catch {}
}

// ===================== RECENT FOODS =====================

export async function loadRecentFoods(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECENT_FOODS);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export async function addRecentFood(foodId: string): Promise<void> {
  const recent = await loadRecentFoods();
  const filtered = recent.filter((id) => id !== foodId);
  filtered.unshift(foodId);
  await AsyncStorage.setItem(KEYS.RECENT_FOODS, JSON.stringify(filtered.slice(0, 20)));
}

// ===================== CUSTOM FOODS =====================

export async function loadCustomFoods(): Promise<CustomFood[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CUSTOM_FOODS);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export async function saveCustomFood(food: Omit<CustomFood, "id" | "isCustom">): Promise<CustomFood> {
  const all = await loadCustomFoods();
  const newFood: CustomFood = { ...food, id: "custom_" + generateId(), isCustom: true };
  all.push(newFood);
  await AsyncStorage.setItem(KEYS.CUSTOM_FOODS, JSON.stringify(all));
  return newFood;
}

export async function deleteCustomFood(id: string): Promise<void> {
  const all = await loadCustomFoods();
  const filtered = all.filter((f) => f.id !== id);
  await AsyncStorage.setItem(KEYS.CUSTOM_FOODS, JSON.stringify(filtered));
}

// ===================== MEAL TEMPLATES =====================

export async function loadMealTemplates(): Promise<MealTemplate[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.MEAL_TEMPLATES);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export async function saveMealTemplate(name: string, entries: MealTemplateEntry[]): Promise<MealTemplate> {
  const all = await loadMealTemplates();
  const template: MealTemplate = {
    id: "tpl_" + generateId(),
    name,
    entries,
    totalCalories: Math.round(entries.reduce((s, e) => s + e.calories, 0)),
    createdAt: Date.now(),
  };
  all.push(template);
  await AsyncStorage.setItem(KEYS.MEAL_TEMPLATES, JSON.stringify(all));
  return template;
}

export async function deleteMealTemplate(id: string): Promise<void> {
  const all = await loadMealTemplates();
  await AsyncStorage.setItem(KEYS.MEAL_TEMPLATES, JSON.stringify(all.filter((t) => t.id !== id)));
}

/**
 * Log all entries from a template to a given meal type and date.
 * Returns the number of entries logged.
 */
export async function logMealTemplate(
  template: MealTemplate,
  mealType: MealType,
  date: string
): Promise<number> {
  for (const entry of template.entries) {
    await addFoodLogEntry({
      foodId: entry.foodId,
      foodName: entry.foodName,
      mealType,
      servingGrams: entry.servingGrams,
      servingUnit: `${entry.servingGrams}g`,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      date,
    });
  }
  return template.entries.length;
}

// ===================== DATA MANAGEMENT =====================

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export async function getDailyCalorieSummary(date: string): Promise<{
  consumed: number;
  burned: number;
  net: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}> {
  const [foodLog, exerciseLog] = await Promise.all([
    loadFoodLog(date),
    loadExerciseLog(date),
  ]);

  const consumed = foodLog.reduce((sum, e) => sum + e.calories, 0);
  const burned = exerciseLog.reduce((sum, e) => sum + e.caloriesBurned, 0);
  const protein = foodLog.reduce((sum, e) => sum + e.protein, 0);
  const carbs = foodLog.reduce((sum, e) => sum + e.carbs, 0);
  const fat = foodLog.reduce((sum, e) => sum + e.fat, 0);
  const fiber = foodLog.reduce((sum, e) => sum + (e.fiber || 0), 0);

  return {
    consumed: Math.round(consumed),
    burned: Math.round(burned),
    net: Math.round(consumed - burned),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
  };
}
