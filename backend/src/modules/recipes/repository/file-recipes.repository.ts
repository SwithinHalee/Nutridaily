import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import {
  CreateRecipeData,
  RecipePatch,
  RecipeRecord,
  RecipesRepository,
} from './recipes.repository';

/**
 * Penyimpanan file JSON untuk pengembangan. Dipakai saat DATABASE_URL
 * tidak diset sehingga perubahan admin tetap ada setelah server restart.
 * Di production dengan Postgres, PrismaRecipesRepository yang dipakai.
 */
export class FileRecipesRepository implements RecipesRepository {
  readonly kind = 'memory' as const;
  private readonly filePath: string;
  private readonly rows = new Map<string, RecipeRecord>();

  constructor(filePath?: string) {
    this.filePath = filePath || FileRecipesRepository.resolveStorePath('recipes.store.json');
    this.load();
  }

  /**
   * Resolve backend/data/*.store.json regardless of cwd (root runner uses
   * process.cwd()=repo root, direct backend run uses backend/). Prefers an
   * existing file so legacy stores are never orphaned.
   */
  static resolveStorePath(fileName: string): string {
    const candidates = [
      join(process.cwd(), 'backend', 'data', fileName),
      join(process.cwd(), 'data', fileName),
      join(__dirname, '..', '..', '..', '..', 'data', fileName),
    ];
    for (const p of candidates) {
      try {
        if (existsSync(p)) return p;
      } catch {
        // ignore and try next candidate
      }
    }
    return candidates[0];
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

  private static reviveDate(value: string | null): Date | null {
    if (value == null) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private load(): void {
    try {
      if (!existsSync(this.filePath)) return;
      const raw = JSON.parse(readFileSync(this.filePath, 'utf8')) as Array<Record<string, unknown>>;
      if (!Array.isArray(raw)) return;
      for (const item of raw) {
        const row = item as unknown as RecipeRecord;
        if (!row || typeof row.id !== 'string') continue;
        this.rows.set(row.id, {
          ...row,
          availableFrom: FileRecipesRepository.reviveDate(row.availableFrom as unknown as string),
          availableUntil: FileRecipesRepository.reviveDate(row.availableUntil as unknown as string),
          availableDays: FileRecipesRepository.toDaysOrNull(row.availableDays as unknown),
          labTestedPurityDate: FileRecipesRepository.reviveDate(row.labTestedPurityDate as unknown as string),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        });
      }
    } catch {
      // File rusak atau belum ada. Mulai dari penyimpanan kosong.
    }
  }

  private persist(): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(Array.from(this.rows.values()), null, 2), 'utf8');
    } catch {
      // Gagal tulis tidak boleh menggagalkan request. Data tetap di memori.
    }
  }

  async list(): Promise<RecipeRecord[]> {
    return Array.from(this.rows.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findById(id: string): Promise<RecipeRecord | null> {
    return this.rows.get(id) ?? null;
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
      skuCode: data.skuCode || '',
      title: data.title,
      category: data.category,
      calories: data.calories,
      proteinGrams: data.proteinGrams,
      carbsGrams: data.carbsGrams,
      fatGrams: data.fatGrams,
      ingredients: data.ingredients ?? [],
      allergens: data.allergens ?? [],
      labTestedPurityDate: FileRecipesRepository.toDateOrNull(data.labTestedPurityDate),
      macroLabReportUrl: data.macroLabReportUrl ?? null,
      qrVerificationCode: data.qrVerificationCode,
      imageUrl: data.imageUrl ?? null,
      isActive: data.isActive ?? true,
      availableFrom: FileRecipesRepository.toDateOrNull(data.availableFrom),
      availableUntil: FileRecipesRepository.toDateOrNull(data.availableUntil),
      availableDays: FileRecipesRepository.toDaysOrNull(data.availableDays),
      ingredientCostRp:
        data.ingredientCostRp == null || (data.ingredientCostRp as unknown) === ''
          ? null
          : Number(data.ingredientCostRp),
      details: data.details ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(row.id, row);
    this.persist();
    return row;
  }

  async update(id: string, patch: RecipePatch): Promise<RecipeRecord> {
    const row = this.rows.get(id);
    if (!row) throw new Error(`Resep ${id} tidak ditemukan.`);
    const normalized: RecipePatch = { ...patch };
    if ('availableFrom' in normalized) {
      normalized.availableFrom = FileRecipesRepository.toDateOrNull(normalized.availableFrom);
    }
    if ('availableUntil' in normalized) {
      normalized.availableUntil = FileRecipesRepository.toDateOrNull(normalized.availableUntil);
    }
    if ('availableDays' in normalized) {
      normalized.availableDays = FileRecipesRepository.toDaysOrNull(normalized.availableDays);
    }
    Object.assign(row, normalized, { updatedAt: new Date() });
    this.rows.set(id, row);
    this.persist();
    return row;
  }

  async remove(id: string): Promise<void> {
    if (!this.rows.delete(id)) throw new Error(`Resep ${id} tidak ditemukan.`);
    this.persist();
  }
}
