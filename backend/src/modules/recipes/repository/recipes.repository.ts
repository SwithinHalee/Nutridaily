export interface RecipeRecord {
  id: string;
  skuCode: string;
  title: string;
  category: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  ingredients: unknown;
  allergens: string[];
  labTestedPurityDate: Date | null;
  macroLabReportUrl: string | null;
  qrVerificationCode: string;
  imageUrl: string | null;
  isActive: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;
  availableDays: string[] | null;
  ingredientCostRp: number | null;
  details: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecipeData {
  skuCode?: string;
  title: string;
  category: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  ingredients?: unknown;
  allergens?: string[];
  labTestedPurityDate?: Date | null;
  macroLabReportUrl?: string | null;
  qrVerificationCode: string;
  imageUrl?: string | null;
  isActive?: boolean;
  availableFrom?: Date | string | null;
  availableUntil?: Date | string | null;
  availableDays?: string[] | null;
  ingredientCostRp?: number | null;
  details?: unknown;
}

export type RecipePatch = Partial<CreateRecipeData>;

export interface RecipesRepository {
  readonly kind: 'prisma' | 'memory';
  list(): Promise<RecipeRecord[]>;
  findById(id: string): Promise<RecipeRecord | null>;
  create(data: CreateRecipeData): Promise<RecipeRecord>;
  update(id: string, patch: RecipePatch): Promise<RecipeRecord>;
  remove(id: string): Promise<void>;
}

export const RECIPES_REPOSITORY = Symbol('RECIPES_REPOSITORY');
