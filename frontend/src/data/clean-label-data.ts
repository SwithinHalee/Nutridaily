// Hanya tipe data. Seluruh isi dari API backend, tanpa data contoh di file ini.
export interface IngredientSource {
  name: string;
  origin: string;
  harvestMethod: string;
  certifications: string[];
}

export interface GrammageSpec {
  label: string;
  weight: string;
}

export interface NutritionFacts {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sodiumMg: number;
  glycemicIndex: number;
}

export interface LabCertification {
  laboratory: string;
  certificateNumber: string;
  testDate: string;
  status: string;
  microbiology: string;
  accuracyRating: string;
}

export interface VerifiedMealItem {
  id: string;
  skuCode: string;
  qrCode: string;
  isActive?: boolean;
  batchCode: string;
  ticketNumber: string;
  shortTitle: string;
  recipeTitle: string;
  category: string;
  portionWeightGrams: number;
  toleranceGrams: number;
  imageUrl: string;
  imageCaption: string;
  packagingTimestamp: string;
  nutritionFacts: NutritionFacts;
  labCertification: LabCertification;
  ingredientsSourcing: IngredientSource[];
  grammage: GrammageSpec[];
  chefNotes: string;
  allergenWarning: string[];
}
