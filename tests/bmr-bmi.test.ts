import { describe, it, expect } from "vitest";
import {
  calculateBMR,
  calculateBMI,
  getBMICategory,
  getBMIDetail,
  calculateTDEE,
  ACTIVITY_LABELS,
} from "../lib/store";

// ─── BMR Tests ────────────────────────────────────────────────────────────────

describe("calculateBMR", () => {
  it("computes BMR for a typical male using Mifflin-St Jeor", () => {
    // Male, 30y, 175cm, 75kg → (10×75) + (6.25×175) − (5×30) + 5 = 750 + 1093.75 − 150 + 5 = 1698.75 → 1699
    const bmr = calculateBMR({ age: 30, gender: "male", heightCm: 175, weightKg: 75 });
    expect(bmr).toBe(1699);
  });

  it("computes BMR for a typical female using Mifflin-St Jeor", () => {
    // Female, 28y, 162cm, 60kg → (10×60) + (6.25×162) − (5×28) − 161 = 600 + 1012.5 − 140 − 161 = 1311.5 → 1312
    const bmr = calculateBMR({ age: 28, gender: "female", heightCm: 162, weightKg: 60 });
    expect(bmr).toBe(1312);
  });

  it("uses defaults when profile fields are missing", () => {
    const bmr = calculateBMR({});
    // Default: male, 30y, 170cm, 70kg → (10×70) + (6.25×170) − (5×30) + 5 = 700 + 1062.5 − 150 + 5 = 1617.5 → 1618
    expect(bmr).toBe(1618);
  });

  it("BMR increases with higher weight", () => {
    const light = calculateBMR({ gender: "male", age: 30, heightCm: 175, weightKg: 60 });
    const heavy = calculateBMR({ gender: "male", age: 30, heightCm: 175, weightKg: 90 });
    expect(heavy).toBeGreaterThan(light);
  });

  it("BMR decreases with older age", () => {
    const young = calculateBMR({ gender: "female", age: 20, heightCm: 165, weightKg: 65 });
    const older = calculateBMR({ gender: "female", age: 60, heightCm: 165, weightKg: 65 });
    expect(older).toBeLessThan(young);
  });

  it("male BMR is higher than female BMR for same stats", () => {
    const male = calculateBMR({ age: 35, gender: "male", heightCm: 170, weightKg: 70 });
    const female = calculateBMR({ age: 35, gender: "female", heightCm: 170, weightKg: 70 });
    // Difference is exactly 166 (5 vs -161)
    expect(male - female).toBe(166);
  });

  it("BMR is always a positive integer", () => {
    const bmr = calculateBMR({ age: 25, gender: "female", heightCm: 155, weightKg: 50 });
    expect(bmr).toBeGreaterThan(0);
    expect(Number.isInteger(bmr)).toBe(true);
  });
});

// ─── TDEE Tests ───────────────────────────────────────────────────────────────

describe("calculateTDEE", () => {
  it("TDEE is always greater than BMR", () => {
    const profile = { age: 30, gender: "male" as const, heightCm: 175, weightKg: 75, activityLevel: "sedentary" as const };
    const bmr = calculateBMR(profile);
    const tdee = calculateTDEE(profile);
    expect(tdee).toBeGreaterThan(bmr);
  });

  it("higher activity level produces higher TDEE", () => {
    const base = { age: 30, gender: "female" as const, heightCm: 165, weightKg: 65 };
    const sedentary = calculateTDEE({ ...base, activityLevel: "sedentary" });
    const veryActive = calculateTDEE({ ...base, activityLevel: "very_active" });
    expect(veryActive).toBeGreaterThan(sedentary);
  });

  it("sedentary multiplier is 1.2", () => {
    const profile = { age: 30, gender: "male" as const, heightCm: 175, weightKg: 75, activityLevel: "sedentary" as const };
    const bmr = calculateBMR(profile);
    const tdee = calculateTDEE(profile);
    expect(tdee).toBe(Math.round(bmr * 1.2));
  });
});

// ─── BMI Tests ────────────────────────────────────────────────────────────────

describe("calculateBMI", () => {
  it("computes BMI correctly for a typical person", () => {
    // 70kg, 175cm → 70 / (1.75²) = 70 / 3.0625 ≈ 22.9
    const bmi = calculateBMI(70, 175);
    expect(bmi).toBe(22.9);
  });

  it("returns a number with at most 1 decimal place", () => {
    const bmi = calculateBMI(68, 172);
    const str = bmi.toString();
    const decimals = str.includes(".") ? str.split(".")[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });

  it("BMI increases with higher weight at same height", () => {
    const low = calculateBMI(55, 170);
    const high = calculateBMI(95, 170);
    expect(high).toBeGreaterThan(low);
  });

  it("BMI decreases with taller height at same weight", () => {
    const short = calculateBMI(70, 160);
    const tall = calculateBMI(70, 190);
    expect(tall).toBeLessThan(short);
  });
});

// ─── BMI Category Tests ───────────────────────────────────────────────────────

describe("getBMICategory", () => {
  it("classifies BMI < 18.5 as Underweight", () => {
    expect(getBMICategory(17.0)).toBe("Underweight");
    expect(getBMICategory(18.4)).toBe("Underweight");
  });

  it("classifies BMI 18.5–24.9 as Normal weight", () => {
    expect(getBMICategory(18.5)).toBe("Normal weight");
    expect(getBMICategory(22.0)).toBe("Normal weight");
    expect(getBMICategory(24.9)).toBe("Normal weight");
  });

  it("classifies BMI 25–29.9 as Overweight", () => {
    expect(getBMICategory(25.0)).toBe("Overweight");
    expect(getBMICategory(27.5)).toBe("Overweight");
    expect(getBMICategory(29.9)).toBe("Overweight");
  });

  it("classifies BMI 30–34.9 as High BMI (Class I)", () => {
    expect(getBMICategory(30.0)).toBe("High BMI (Class I)");
    expect(getBMICategory(34.9)).toBe("High BMI (Class I)");
  });

  it("classifies BMI ≥ 35 as High BMI (Class II+)", () => {
    expect(getBMICategory(35.0)).toBe("High BMI (Class II+)");
    expect(getBMICategory(40.0)).toBe("High BMI (Class II+)");
  });
});

// ─── BMI Detail Tests ─────────────────────────────────────────────────────────

describe("getBMIDetail", () => {
  it("returns blue color for underweight", () => {
    const detail = getBMIDetail(16.5);
    expect(detail.color).toBe("#3B82F6");
    expect(detail.category).toBe("Underweight");
  });

  it("returns green color for normal weight", () => {
    const detail = getBMIDetail(22.0);
    expect(detail.color).toBe("#22C55E");
    expect(detail.category).toBe("Normal weight");
  });

  it("returns amber color for overweight", () => {
    const detail = getBMIDetail(27.0);
    expect(detail.color).toBe("#F59E0B");
    expect(detail.category).toBe("Overweight");
  });

  it("returns red color for High BMI Class I", () => {
    const detail = getBMIDetail(32.0);
    expect(detail.color).toBe("#EF4444");
    expect(detail.category).toBe("High BMI (Class I)");
  });

  it("returns dark red for High BMI Class II+", () => {
    const detail = getBMIDetail(38.0);
    expect(detail.color).toBe("#B91C1C");
    expect(detail.category).toBe("High BMI (Class II+)");
  });

  it("always includes advice and range fields", () => {
    [15, 20, 27, 32, 38].forEach((bmi) => {
      const detail = getBMIDetail(bmi);
      expect(detail.advice.length).toBeGreaterThan(0);
      expect(detail.range.length).toBeGreaterThan(0);
      expect(detail.description.length).toBeGreaterThan(0);
    });
  });
});

// ─── ACTIVITY_LABELS Tests ────────────────────────────────────────────────────

describe("ACTIVITY_LABELS", () => {
  it("has entries for all 5 activity levels", () => {
    const keys = Object.keys(ACTIVITY_LABELS);
    expect(keys).toContain("sedentary");
    expect(keys).toContain("light");
    expect(keys).toContain("moderate");
    expect(keys).toContain("active");
    expect(keys).toContain("very_active");
  });

  it("multipliers are in ascending order", () => {
    const multipliers = Object.values(ACTIVITY_LABELS).map((v) => v.multiplier);
    for (let i = 1; i < multipliers.length; i++) {
      expect(multipliers[i]).toBeGreaterThan(multipliers[i - 1]);
    }
  });
});
