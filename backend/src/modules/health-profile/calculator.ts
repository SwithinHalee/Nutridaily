export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
export type Gender = 'MALE' | 'FEMALE';
export type DietGoal = 'WEIGHT_LOSS_LEAN_SCULPT' | 'MUSCLE_GAIN_FIT_BUILD' | 'MAINTENANCE_VITALITY_DAILY' | 'THERAPEUTIC_DIET';

export interface TdeeInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: DietGoal;
}

export interface MacroTarget {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  bmr: number;
  tdee: number;
  recommendedCategory: DietGoal;
  description: string;
}

export class NutritionCalculator {
  /**
   * Calculates Basal Metabolic Rate (BMR) via Mifflin-St Jeor Formula
   * Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
   * Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
   */
  public static calculateBmr(weightKg: number, heightCm: number, age: number, gender: Gender): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === 'MALE' ? Math.round(base + 5) : Math.round(base - 161);
  }

  /**
   * Calculates Total Daily Energy Expenditure (TDEE)
   */
  public static calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
    const multiplierMap: Record<ActivityLevel, number> = {
      SEDENTARY: 1.2,       // Sedikit atau tidak berolahraga (pekerja kantoran)
      LIGHT: 1.375,         // Olahraga ringan 1-3 hari/minggu
      MODERATE: 1.55,       // Olahraga sedang 3-5 hari/minggu
      VERY_ACTIVE: 1.725,   // Olahraga berat 6-7 hari/minggu
      EXTRA_ACTIVE: 1.9,    // Atlet fisik/pekerja lapangan sangat berat
    };

    const multiplier = multiplierMap[activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
  }

  /**
   * Calculates target calories and macronutrient breakdown (Grammage) based on dietary goal
   */
  public static calculateMacroTarget(input: TdeeInput): MacroTarget {
    const bmr = this.calculateBmr(input.weightKg, input.heightCm, input.age, input.gender);
    const tdee = this.calculateTdee(bmr, input.activityLevel);

    let targetCalories: number;
    let proteinRatio: number;
    let carbsRatio: number;
    let fatRatio: number;
    let description: string;

    switch (input.goal) {
      case 'WEIGHT_LOSS_LEAN_SCULPT':
        targetCalories = Math.max(1200, Math.min(1450, Math.round(tdee * 0.75)));
        proteinRatio = 0.35;
        carbsRatio = 0.35;
        fatRatio = 0.30;
        description = 'Defisit kalori optimal untuk pembakaran lemak dengan preserver massa otot lean.';
        break;

      case 'MUSCLE_GAIN_FIT_BUILD':
        targetCalories = Math.max(2000, Math.min(2500, Math.round(tdee * 1.15)));
        proteinRatio = 0.30;
        carbsRatio = 0.50;
        fatRatio = 0.20;
        description = 'Surplus nutrisi terukur dengan asupan karbohidrat kompleks & protein tinggi untuk hipertrofi otot.';
        break;

      case 'THERAPEUTIC_DIET':
        targetCalories = Math.max(1400, Math.min(1600, Math.round(tdee * 0.85)));
        proteinRatio = 0.25;
        carbsRatio = 0.45;
        fatRatio = 0.30;
        description = 'Diet klinis terstandarisasi untuk regulasi glukosa darah dan tekanan darah (DASH & Low GI).';
        break;

      case 'MAINTENANCE_VITALITY_DAILY':
      default:
        targetCalories = Math.max(1600, Math.min(1850, tdee));
        proteinRatio = 0.25;
        carbsRatio = 0.50;
        fatRatio = 0.25;
        description = 'Keseimbangan energi harian untuk stamina prima, fokus kerja, dan kesehatan metabolik jangka panjang.';
        break;
    }

    // 1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal
    const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
    const carbsGrams = Math.round((targetCalories * carbsRatio) / 4);
    const fatGrams = Math.round((targetCalories * fatRatio) / 9);

    return {
      bmr,
      tdee,
      calories: targetCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      recommendedCategory: input.goal,
      description,
    };
  }
}
