export interface ExerciseItem {
  id: string;
  name: string;
  category: "Cardio" | "Strength" | "Flexibility" | "Sports";
  metValue: number; // MET (Metabolic Equivalent of Task)
  icon: string;
}

// Calories burned = MET × weight(kg) × time(hours)
export function calculateCaloriesBurned(
  metValue: number,
  weightKg: number,
  durationMinutes: number
): number {
  return Math.round(metValue * weightKg * (durationMinutes / 60));
}

export const EXERCISE_DATABASE: ExerciseItem[] = [
  // Cardio
  { id: "e001", name: "Running (6 mph)", category: "Cardio", metValue: 9.8, icon: "figure.run" },
  { id: "e002", name: "Running (5 mph)", category: "Cardio", metValue: 8.3, icon: "figure.run" },
  { id: "e003", name: "Walking (3 mph)", category: "Cardio", metValue: 3.5, icon: "figure.walk" },
  { id: "e004", name: "Walking (brisk, 4 mph)", category: "Cardio", metValue: 5.0, icon: "figure.walk" },
  { id: "e005", name: "Cycling (moderate)", category: "Cardio", metValue: 8.0, icon: "figure.outdoor.cycle" },
  { id: "e006", name: "Cycling (vigorous)", category: "Cardio", metValue: 10.0, icon: "figure.outdoor.cycle" },
  { id: "e007", name: "Swimming (moderate)", category: "Cardio", metValue: 6.0, icon: "figure.pool.swim" },
  { id: "e008", name: "Jump Rope", category: "Cardio", metValue: 11.8, icon: "figure.jumprope" },
  { id: "e009", name: "Elliptical (moderate)", category: "Cardio", metValue: 5.0, icon: "figure.elliptical" },
  { id: "e010", name: "Rowing (moderate)", category: "Cardio", metValue: 7.0, icon: "figure.rowing" },
  { id: "e011", name: "Stair Climbing", category: "Cardio", metValue: 8.8, icon: "figure.stair.stepper" },
  { id: "e012", name: "Dancing", category: "Cardio", metValue: 5.5, icon: "figure.dance" },
  { id: "e013", name: "HIIT", category: "Cardio", metValue: 8.0, icon: "bolt.fill" },
  { id: "e014", name: "Aerobics (low impact)", category: "Cardio", metValue: 5.0, icon: "figure.aerobics" },
  { id: "e015", name: "Aerobics (high impact)", category: "Cardio", metValue: 7.3, icon: "figure.aerobics" },

  // Strength
  { id: "e016", name: "Weight Training (general)", category: "Strength", metValue: 3.5, icon: "dumbbell.fill" },
  { id: "e017", name: "Weight Training (vigorous)", category: "Strength", metValue: 6.0, icon: "dumbbell.fill" },
  { id: "e018", name: "Push-ups", category: "Strength", metValue: 3.8, icon: "figure.strengthtraining.functional" },
  { id: "e019", name: "Pull-ups", category: "Strength", metValue: 4.0, icon: "figure.strengthtraining.functional" },
  { id: "e020", name: "Squats", category: "Strength", metValue: 5.0, icon: "figure.strengthtraining.traditional" },
  { id: "e021", name: "Deadlifts", category: "Strength", metValue: 6.0, icon: "figure.strengthtraining.traditional" },
  { id: "e022", name: "Bench Press", category: "Strength", metValue: 5.0, icon: "figure.strengthtraining.traditional" },
  { id: "e023", name: "Kettlebell Training", category: "Strength", metValue: 8.0, icon: "dumbbell.fill" },
  { id: "e024", name: "CrossFit", category: "Strength", metValue: 8.0, icon: "figure.strengthtraining.functional" },
  { id: "e025", name: "Pilates", category: "Strength", metValue: 3.0, icon: "figure.pilates" },

  // Flexibility
  { id: "e026", name: "Yoga (general)", category: "Flexibility", metValue: 2.5, icon: "figure.yoga" },
  { id: "e027", name: "Yoga (power)", category: "Flexibility", metValue: 4.0, icon: "figure.yoga" },
  { id: "e028", name: "Stretching", category: "Flexibility", metValue: 2.3, icon: "figure.flexibility" },
  { id: "e029", name: "Tai Chi", category: "Flexibility", metValue: 3.0, icon: "figure.taichi" },

  // Sports
  { id: "e030", name: "Basketball", category: "Sports", metValue: 6.5, icon: "sportscourt.fill" },
  { id: "e031", name: "Soccer", category: "Sports", metValue: 7.0, icon: "sportscourt.fill" },
  { id: "e032", name: "Tennis", category: "Sports", metValue: 7.3, icon: "figure.tennis" },
  { id: "e033", name: "Golf (walking)", category: "Sports", metValue: 4.8, icon: "figure.golf" },
  { id: "e034", name: "Volleyball", category: "Sports", metValue: 4.0, icon: "sportscourt.fill" },
  { id: "e035", name: "Hiking", category: "Sports", metValue: 6.0, icon: "figure.hiking" },
];

export function searchExercises(query: string): ExerciseItem[] {
  if (!query.trim()) return EXERCISE_DATABASE;
  const lower = query.toLowerCase();
  return EXERCISE_DATABASE.filter(
    (e) =>
      e.name.toLowerCase().includes(lower) ||
      e.category.toLowerCase().includes(lower)
  );
}

export const EXERCISE_CATEGORIES = ["Cardio", "Strength", "Flexibility", "Sports"] as const;
