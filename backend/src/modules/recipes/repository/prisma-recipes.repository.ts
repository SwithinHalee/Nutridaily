import { PrismaClient } from '@prisma/client';
import {
  CreateRecipeData,
  RecipePatch,
  RecipeRecord,
  RecipesRepository,
} from './recipes.repository';

export class PrismaRecipesRepository implements RecipesRepository {
  readonly kind = 'prisma' as const;

  constructor(private readonly prisma: PrismaClient) {}

  private toRecord(row: any): RecipeRecord {
    return {
      ...row,
      category: String(row.category),
      availableDays: Array.isArray(row.availableDays) ? row.availableDays : row.availableDays ?? null,
    };
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

  private availabilityFields(data: CreateRecipeData | RecipePatch): {
    availableFrom: Date | null;
    availableUntil: Date | null;
    ingredientCostRp: number | null;
  } {
    const toDate = (value: unknown): Date | null => {
      if (value == null || value === '') return null;
      const parsed = value instanceof Date ? value : new Date(String(value));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    return {
      availableFrom: 'availableFrom' in data ? toDate((data as any).availableFrom) : null,
      availableUntil: 'availableUntil' in data ? toDate((data as any).availableUntil) : null,
      ingredientCostRp:
        'ingredientCostRp' in data && (data as any).ingredientCostRp != null && (data as any).ingredientCostRp !== ''
          ? Number((data as any).ingredientCostRp)
          : null,
    };
  }

  async list(): Promise<RecipeRecord[]> {
    const rows = await this.prisma.recipe.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((r) => this.toRecord(r));
  }

  async findById(id: string): Promise<RecipeRecord | null> {
    const row = await this.prisma.recipe.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async create(data: CreateRecipeData): Promise<RecipeRecord> {
    // Kolom String[] tidak menerima null eksplisit. Hilangkan kunci saat
    // tidak ada hari dipilih agar Postgres memakai daftar kosong bawaan.
    const days = PrismaRecipesRepository.toDaysOrNull((data as any).availableDays);
    const row = await this.prisma.recipe.create({
      data: {
        skuCode: data.skuCode,
        title: data.title,
        category: data.category as any,
        calories: data.calories,
        proteinGrams: data.proteinGrams,
        carbsGrams: data.carbsGrams,
        fatGrams: data.fatGrams,
        ingredients: (data.ingredients ?? []) as any,
        allergens: data.allergens ?? [],
        labTestedPurityDate: data.labTestedPurityDate ?? null,
        macroLabReportUrl: data.macroLabReportUrl ?? null,
        qrVerificationCode: data.qrVerificationCode,
        imageUrl: data.imageUrl ?? null,
        isActive: data.isActive ?? true,
        ...(this.availabilityFields(data) as any),
        ...(days != null ? { availableDays: days } : {}),
        details: (data.details ?? null) as any,
      },
    });
    return this.toRecord(row);
  }

  async update(id: string, patch: RecipePatch): Promise<RecipeRecord> {
    const row = await this.prisma.recipe.update({
      where: { id },
      data: {
        ...('skuCode' in patch ? { skuCode: patch.skuCode } : {}),
        ...('title' in patch ? { title: patch.title } : {}),
        ...('category' in patch ? { category: patch.category as any } : {}),
        ...('calories' in patch ? { calories: patch.calories } : {}),
        ...('proteinGrams' in patch ? { proteinGrams: patch.proteinGrams } : {}),
        ...('carbsGrams' in patch ? { carbsGrams: patch.carbsGrams } : {}),
        ...('fatGrams' in patch ? { fatGrams: patch.fatGrams } : {}),
        ...('ingredients' in patch ? { ingredients: patch.ingredients as any } : {}),
        ...('allergens' in patch ? { allergens: patch.allergens } : {}),
        ...('labTestedPurityDate' in patch ? { labTestedPurityDate: patch.labTestedPurityDate } : {}),
        ...('macroLabReportUrl' in patch ? { macroLabReportUrl: patch.macroLabReportUrl } : {}),
        ...('qrVerificationCode' in patch ? { qrVerificationCode: patch.qrVerificationCode } : {}),
        ...('imageUrl' in patch ? { imageUrl: patch.imageUrl } : {}),
        ...('isActive' in patch ? { isActive: patch.isActive } : {}),
        // Null berarti bersihkan jadwal. Daftar kosong Prisma memakai { set: [] }.
        ...('availableDays' in patch
          ? (() => {
              const days = PrismaRecipesRepository.toDaysOrNull((patch as any).availableDays);
              return days != null ? { availableDays: days } : { availableDays: { set: [] } };
            })()
          : {}),
        ...('details' in patch ? { details: (patch.details ?? null) as any } : {}),
        ...('availableFrom' in patch ? { availableFrom: (this.availabilityFields(patch) as any).availableFrom } : {}),
        ...('availableUntil' in patch ? { availableUntil: (this.availabilityFields(patch) as any).availableUntil } : {}),
        ...('ingredientCostRp' in patch ? { ingredientCostRp: (this.availabilityFields(patch) as any).ingredientCostRp } : {}),
      },
    });
    return this.toRecord(row);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.recipe.delete({ where: { id } });
  }
}
