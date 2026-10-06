import { NutritionCalculator } from '../modules/health-profile/calculator';

describe('NutritionCalculator (TDEE & Macro Grammage Engine)', () => {
  it('should calculate BMR accurately for Male using Mifflin-St Jeor formula', () => {
    // Male: 75kg, 175cm, 28 years old
    // BMR = (10 * 75) + (6.25 * 175) - (5 * 28) + 5 = 750 + 1093.75 - 140 + 5 = 1708.75 ~ 1709
    const bmr = NutritionCalculator.calculateBmr(75, 175, 28, 'MALE');
    expect(bmr).toBe(1709);
  });

  it('should calculate BMR accurately for Female using Mifflin-St Jeor formula', () => {
    // Female: 58kg, 162cm, 26 years old
    // BMR = (10 * 58) + (6.25 * 162) - (5 * 26) - 161 = 580 + 1012.5 - 130 - 161 = 1301.5 ~ 1302
    const bmr = NutritionCalculator.calculateBmr(58, 162, 26, 'FEMALE');
    expect(bmr).toBe(1302);
  });

  it('should calculate TDEE based on activity level multiplier', () => {
    const bmr = 1500;
    expect(NutritionCalculator.calculateTdee(bmr, 'SEDENTARY')).toBe(1800); // 1500 * 1.2
    expect(NutritionCalculator.calculateTdee(bmr, 'LIGHT')).toBe(2063);     // 1500 * 1.375
    expect(NutritionCalculator.calculateTdee(bmr, 'MODERATE')).toBe(2325);  // 1500 * 1.55
    expect(NutritionCalculator.calculateTdee(bmr, 'VERY_ACTIVE')).toBe(2588); // 1500 * 1.725
  });

  it('should generate targeted calorie deficit and high protein for Weight Loss (Lean & Sculpt)', () => {
    const target = NutritionCalculator.calculateMacroTarget({
      weightKg: 80,
      heightCm: 175,
      age: 30,
      gender: 'MALE',
      activityLevel: 'LIGHT',
      goal: 'WEIGHT_LOSS_LEAN_SCULPT',
    });

    // Must be bounded within healthy deficit ~1200 - 1450 kcal
    expect(target.calories).toBeGreaterThanOrEqual(1200);
    expect(target.calories).toBeLessThanOrEqual(1450);
    expect(target.proteinGrams).toBeGreaterThan(0);
    expect(target.carbsGrams).toBeGreaterThan(0);
    expect(target.fatGrams).toBeGreaterThan(0);
  });

  it('should generate targeted calorie surplus for Muscle Gain (Fit & Build)', () => {
    const target = NutritionCalculator.calculateMacroTarget({
      weightKg: 65,
      heightCm: 172,
      age: 24,
      gender: 'MALE',
      activityLevel: 'VERY_ACTIVE',
      goal: 'MUSCLE_GAIN_FIT_BUILD',
    });

    expect(target.calories).toBeGreaterThanOrEqual(2000);
    expect(target.calories).toBeLessThanOrEqual(2500);
  });
});
