import { randomUUID } from 'crypto';
import {
  CreateRecipeData,
  RecipePatch,
  RecipeRecord,
  RecipesRepository,
} from './recipes.repository';

export class InMemoryRecipesRepository implements RecipesRepository {
  readonly kind = 'memory' as const;
  private readonly rows = new Map<string, RecipeRecord>();

  async list(): Promise<RecipeRecord[]> {
    return Array.from(this.rows.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findById(id: string): Promise<RecipeRecord | null> {
    return this.rows.get(id) ?? null;
  }

  private static toDateOrNull(value: Date | string | null | undefined): Date | null {
    if (value == null || value === '') return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private static toDaysOrNull(value: unknown): string[] | null {
    if (value == null) return null;
    const list = Array.isArray(value) ? value : [value];
    const cleaned = list
      .map((d) => String(d).substring(0, 10))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    const unique = Array.from(new Set(cleaned)).sort();
    return unique.length > 0 ? unique : null;
  }

  async create(data: CreateRecipeData): Promise<RecipeRecord> {
    for (const row of this.rows.values()) {
      if (row.skuCode === data.skuCode || row.qrVerificationCode === data.qrVerificationCode) {
        throw new Error(`Duplikat skuCode/qrVerificationCode: ${data.skuCode}`);
      }
    }
    const now = new Date();
    const row: RecipeRecord = {
      id: randomUUID(),
      skuCode: data.skuCode,
      title: data.title,
      category: data.category,
      calories: data.calories,
      proteinGrams: data.proteinGrams,
      carbsGrams: data.carbsGrams,
      fatGrams: data.fatGrams,
      ingredients: data.ingredients ?? [],
      allergens: data.allergens ?? [],
      labTestedPurityDate: data.labTestedPurityDate ?? null,
      macroLabReportUrl: data.macroLabReportUrl ?? null,
      qrVerificationCode: data.qrVerificationCode,
      imageUrl: data.imageUrl ?? null,
      isActive: data.isActive ?? true,
      availableFrom: InMemoryRecipesRepository.toDateOrNull(data.availableFrom),
      availableUntil: InMemoryRecipesRepository.toDateOrNull(data.availableUntil),
      availableDays: InMemoryRecipesRepository.toDaysOrNull(data.availableDays),
      ingredientCostRp:
        data.ingredientCostRp == null || (data.ingredientCostRp as unknown) === ''
          ? null
          : Number(data.ingredientCostRp),
      details: data.details ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(row.id, row);
    return row;
  }

  async update(id: string, patch: RecipePatch): Promise<RecipeRecord> {
    const row = this.rows.get(id);
    if (!row) throw new Error(`Resep ${id} tidak ditemukan.`);
    const normalized: RecipePatch = { ...patch };
    if ('availableFrom' in normalized) {
      normalized.availableFrom = InMemoryRecipesRepository.toDateOrNull(normalized.availableFrom);
    }
    if ('availableUntil' in normalized) {
      normalized.availableUntil = InMemoryRecipesRepository.toDateOrNull(normalized.availableUntil);
    }
    if ('availableDays' in normalized) {
      normalized.availableDays = InMemoryRecipesRepository.toDaysOrNull(normalized.availableDays);
    }
    Object.assign(row, normalized, { updatedAt: new Date() });
    this.rows.set(id, row);
    return row;
  }

  async remove(id: string): Promise<void> {
    if (!this.rows.delete(id)) throw new Error(`Resep ${id} tidak ditemukan.`);
  }
}
