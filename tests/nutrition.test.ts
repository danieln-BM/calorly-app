import { describe, it, expect } from "vitest";
import {
  calculateTDEE,
  calculateCalorieGoal,
  calculateBMI,
  getBMICategory,
  calculateMacroGoals,
  calculateNutritionForServing,
  getTodayString,
  formatDate,
  getLast7Days,
  generateId,
} from "../lib/store";
import { searchFoods, getFoodById } from "../lib/food-database";
import { searchExercises, calculateCaloriesBurned } from "../lib/exercise-database";

describe("calculateTDEE", () => {
  it("calculates TDEE for a male with moderate activity", () => {
    const tdee = calculateTDEE({ age: 30, gender: "male", heightCm: 175, weightKg: 75, activityLevel: "moderate" });
    // BMR = 10*75 + 6.25*175 - 5*30 + 5 = 750 + 1093.75 - 150 + 5 = 1698.75
    // TDEE = 1698.75 * 1.55 = 2633
    expect(tdee).toBeGreaterThan(2500);
    expect(tdee).toBeLessThan(2800);
  });

  it("calculates TDEE for a female with sedentary activity", () => {
    const tdee = calculateTDEE({ age: 25, gender: "female", heightCm: 165, weightKg: 60, activityLevel: "sedentary" });
    // BMR = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    // TDEE = 1345.25 * 1.2 = 1614
    expect(tdee).toBeGreaterThan(1500);
    expect(tdee).toBeLessThan(1800);
  });

  it("uses defaults when no profile provided", () => {
    const tdee = calculateTDEE({});
    expect(tdee).toBeGreaterThan(1000);
    expect(tdee).toBeLessThan(4000);
  });
});

describe("calculateCalorieGoal", () => {
  it("reduces calories by 500 for lose goal", () => {
    const tdee = calculateTDEE({ age: 30, gender: "male", heightCm: 175, weightKg: 75, activityLevel: "moderate" });
    const goal = calculateCalorieGoal({ age: 30, gender: "male", heightCm: 175, weightKg: 75, activityLevel: "moderate", goal: "lose" });
    expect(goal).toBe(Math.max(1200, tdee - 500));
  });

  it("adds 300 calories for gain goal", () => {
    const tdee = calculateTDEE({ age: 30, gender: "male", heightCm: 175, weightKg: 75, activityLevel: "moderate" });
    const goal = calculateCalorieGoal({ age: 30, gender: "male", heightCm: 175, weightKg: 75, activityLevel: "moderate", goal: "gain" });
    expect(goal).toBe(tdee + 300);
  });

  it("returns TDEE for maintain goal", () => {
    const tdee = calculateTDEE({ age: 30, gender: "male", heightCm: 175, weightKg: 75, activityLevel: "moderate" });
    const goal = calculateCalorieGoal({ age: 30, gender: "male", heightCm: 175, weightKg: 75, activityLevel: "moderate", goal: "maintain" });
    expect(goal).toBe(tdee);
  });

  it("enforces minimum 1200 kcal for lose goal", () => {
    // Very light person with lose goal
    const goal = calculateCalorieGoal({ age: 20, gender: "female", heightCm: 150, weightKg: 45, activityLevel: "sedentary", goal: "lose" });
    expect(goal).toBeGreaterThanOrEqual(1200);
  });
});

describe("calculateBMI", () => {
  it("calculates BMI correctly", () => {
    const bmi = calculateBMI(70, 175);
    // BMI = 70 / (1.75^2) = 70 / 3.0625 = 22.86
    expect(bmi).toBeCloseTo(22.9, 0);
  });

  it("returns a reasonable value for various inputs", () => {
    expect(calculateBMI(50, 165)).toBeGreaterThan(15);
    expect(calculateBMI(120, 170)).toBeLessThan(50);
  });
});

describe("getBMICategory", () => {
  it("returns Underweight for BMI < 18.5", () => {
    expect(getBMICategory(17.5)).toBe("Underweight");
  });

  it("returns Normal weight for BMI 18.5-24.9", () => {
    expect(getBMICategory(22.0)).toBe("Normal weight");
  });

  it("returns Overweight for BMI 25-29.9", () => {
    expect(getBMICategory(27.0)).toBe("Overweight");
  });

  it("returns High BMI (Class I) for BMI 30-34.9", () => {
    expect(getBMICategory(32.0)).toBe("High BMI (Class I)");
  });

  it("returns High BMI (Class II+) for BMI >= 35", () => {
    expect(getBMICategory(37.0)).toBe("High BMI (Class II+)");
  });
});

describe("calculateMacroGoals", () => {
  it("returns positive macro values for all goals", () => {
    for (const goal of ["lose", "maintain", "gain"]) {
      const macros = calculateMacroGoals(2000, goal);
      expect(macros.protein).toBeGreaterThan(0);
      expect(macros.carbs).toBeGreaterThan(0);
      expect(macros.fat).toBeGreaterThan(0);
    }
  });

  it("higher protein ratio for lose goal", () => {
    const loseMacros = calculateMacroGoals(2000, "lose");
    const maintainMacros = calculateMacroGoals(2000, "maintain");
    expect(loseMacros.protein).toBeGreaterThanOrEqual(maintainMacros.protein);
  });

  it("higher carbs ratio for gain goal", () => {
    const gainMacros = calculateMacroGoals(2000, "gain");
    const maintainMacros = calculateMacroGoals(2000, "maintain");
    expect(gainMacros.carbs).toBeGreaterThanOrEqual(maintainMacros.carbs);
  });
});

describe("calculateNutritionForServing", () => {
  const apple = {
    id: "f001",
    name: "Apple",
    category: "Fruits",
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    defaultServing: 182,
    servingUnit: "1 medium",
  };

  it("scales nutrition correctly for 100g serving", () => {
    const nutrition = calculateNutritionForServing(apple, 100);
    expect(nutrition.calories).toBe(52);
    expect(nutrition.protein).toBeCloseTo(0.3, 1);
    expect(nutrition.carbs).toBeCloseTo(13.8, 1);
  });

  it("scales nutrition correctly for 200g serving", () => {
    const nutrition = calculateNutritionForServing(apple, 200);
    expect(nutrition.calories).toBe(104);
    expect(nutrition.protein).toBeCloseTo(0.6, 1);
  });

  it("scales nutrition correctly for 50g serving", () => {
    const nutrition = calculateNutritionForServing(apple, 50);
    expect(nutrition.calories).toBe(26);
  });
});

describe("Food Database", () => {
  it("finds foods by name", () => {
    const results = searchFoods("apple");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((f) => f.name.toLowerCase().includes("apple"))).toBe(true);
  });

  it("returns all foods for empty query", () => {
    const results = searchFoods("");
    expect(results.length).toBeGreaterThan(50);
  });

  it("finds food by ID", () => {
    const food = getFoodById("f001");
    expect(food).toBeDefined();
    expect(food?.name).toBe("Apple");
  });

  it("returns undefined for invalid ID", () => {
    const food = getFoodById("invalid_id");
    expect(food).toBeUndefined();
  });

  it("all foods have required fields", () => {
    const results = searchFoods("");
    for (const food of results) {
      expect(food.id).toBeTruthy();
      expect(food.name).toBeTruthy();
      expect(food.calories).toBeGreaterThanOrEqual(0);
      expect(food.protein).toBeGreaterThanOrEqual(0);
      expect(food.carbs).toBeGreaterThanOrEqual(0);
      expect(food.fat).toBeGreaterThanOrEqual(0);
      expect(food.defaultServing).toBeGreaterThan(0);
    }
  });
});

describe("Exercise Database", () => {
  it("finds exercises by name", () => {
    const results = searchExercises("running");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns all exercises for empty query", () => {
    const results = searchExercises("");
    expect(results.length).toBeGreaterThan(10);
  });

  it("calculates calories burned correctly", () => {
    // MET 8, 70kg, 30 min = 8 * 70 * (30/60) = 280
    const calories = calculateCaloriesBurned(8, 70, 30);
    expect(calories).toBe(280);
  });

  it("returns 0 for 0 duration", () => {
    expect(calculateCaloriesBurned(8, 70, 0)).toBe(0);
  });
});

describe("Date Utilities", () => {
  it("getTodayString returns YYYY-MM-DD format", () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("getLast7Days returns 7 dates", () => {
    const days = getLast7Days();
    expect(days).toHaveLength(7);
  });

  it("getLast7Days ends with today", () => {
    const days = getLast7Days();
    expect(days[6]).toBe(getTodayString());
  });

  it("formatDate returns Today for today", () => {
    const today = getTodayString();
    expect(formatDate(today)).toBe("Today");
  });

  it("generateId returns unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(0);
  });
});
