import { Inject, Injectable, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Aes256GcmUtil } from '../../common/crypto/aes256.util';
import { NutritionCalculator, TdeeInput, MacroTarget, ActivityLevel, Gender } from './calculator';
import { PRISMA_CLIENT } from '../auth/auth.module';

export interface HealthProfileEntity {
  id: string;
  userId: string;
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  tdeeKcal: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  allergies: string[];
  medicalConditions: string[];
  encryptedMedicalNotes?: string;
  decryptedMedicalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class HealthProfileService {
  // Fallback RAM hanya saat DATABASE_URL tidak diset (dev tanpa Postgres).
  private profiles = new Map<string, HealthProfileEntity>();

  constructor(@Optional() @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient | null = null) {}

  private static toEntity(row: any, decrypted?: string): HealthProfileEntity {
    return {
      id: row.id,
      userId: row.userId,
      heightCm: row.heightCm,
      weightKg: row.weightKg,
      age: row.age,
      gender: row.gender as Gender,
      activityLevel: row.activityLevel as ActivityLevel,
      tdeeKcal: row.tdeeKcal,
      targetCalories: row.targetCalories,
      targetProteinGrams: row.targetProteinGrams,
      targetCarbsGrams: row.targetCarbsGrams,
      targetFatGrams: row.targetFatGrams,
      allergies: row.allergies ?? [],
      medicalConditions: row.medicalConditions ?? [],
      encryptedMedicalNotes: row.encryptedMedicalNotes ?? undefined,
      ...(decrypted !== undefined ? { decryptedMedicalNotes: decrypted } : {}),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public async upsertProfile(
    userId: string,
    data: TdeeInput & {
      allergies?: string[];
      medicalConditions?: string[];
      confidentialMedicalNotes?: string;
    }
  ): Promise<{ profile: HealthProfileEntity; macroBreakdown: MacroTarget }> {
    const macroBreakdown = NutritionCalculator.calculateMacroTarget(data);

    // UU PDP Encrypted medical data
    let encryptedMedicalNotes: string | undefined;
    if (data.confidentialMedicalNotes) {
      encryptedMedicalNotes = Aes256GcmUtil.encrypt(data.confidentialMedicalNotes);
    }

    if (this.prisma) {
      const row = await this.prisma.healthProfile.upsert({
        where: { userId },
        create: {
          userId,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          age: data.age,
          gender: data.gender,
          activityLevel: data.activityLevel,
          tdeeKcal: macroBreakdown.tdee,
          targetCalories: macroBreakdown.calories,
          targetProteinGrams: macroBreakdown.proteinGrams,
          targetCarbsGrams: macroBreakdown.carbsGrams,
          targetFatGrams: macroBreakdown.fatGrams,
          allergies: data.allergies || [],
          medicalConditions: data.medicalConditions || [],
          encryptedMedicalNotes: encryptedMedicalNotes ?? null,
        },
        update: {
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          age: data.age,
          gender: data.gender,
          activityLevel: data.activityLevel,
          tdeeKcal: macroBreakdown.tdee,
          targetCalories: macroBreakdown.calories,
          targetProteinGrams: macroBreakdown.proteinGrams,
          targetCarbsGrams: macroBreakdown.carbsGrams,
          targetFatGrams: macroBreakdown.fatGrams,
          allergies: data.allergies || [],
          medicalConditions: data.medicalConditions || [],
          ...(encryptedMedicalNotes !== undefined ? { encryptedMedicalNotes } : {}),
        },
      });
      const profile = HealthProfileService.toEntity(row, data.confidentialMedicalNotes);
      return { profile, macroBreakdown };
    }

    const profile: HealthProfileEntity = {
      id: 'hp_' + userId,
      userId,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      age: data.age,
      gender: data.gender,
      activityLevel: data.activityLevel,
      tdeeKcal: macroBreakdown.tdee,
      targetCalories: macroBreakdown.calories,
      targetProteinGrams: macroBreakdown.proteinGrams,
      targetCarbsGrams: macroBreakdown.carbsGrams,
      targetFatGrams: macroBreakdown.fatGrams,
      allergies: data.allergies || [],
      medicalConditions: data.medicalConditions || [],
      encryptedMedicalNotes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.profiles.set(userId, profile);

    return {
      profile: {
        ...profile,
        decryptedMedicalNotes: data.confidentialMedicalNotes,
      },
      macroBreakdown,
    };
  }

  public async findProfileByUserId(userId: string): Promise<HealthProfileEntity | null> {
    if (this.prisma) {
      const row = await this.prisma.healthProfile.findUnique({ where: { userId } });
      if (!row) return null;
      let decryptedMedicalNotes: string | undefined;
      if (row.encryptedMedicalNotes) {
        try {
          decryptedMedicalNotes = Aes256GcmUtil.decrypt(row.encryptedMedicalNotes);
        } catch {
          decryptedMedicalNotes = '[Gagal mendekripsi catatan medis]';
        }
      }
      return HealthProfileService.toEntity(row, decryptedMedicalNotes);
    }

    const profile = this.profiles.get(userId);
    if (!profile) return null;

    let decryptedMedicalNotes: string | undefined;
    if (profile.encryptedMedicalNotes) {
      try {
        decryptedMedicalNotes = Aes256GcmUtil.decrypt(profile.encryptedMedicalNotes);
      } catch {
        decryptedMedicalNotes = '[Gagal mendekripsi catatan medis]';
      }
    }

    return {
      ...profile,
      decryptedMedicalNotes,
    };
  }

  /**
   * Tidak ada profil contoh. Kembalikan null agar pemanggil menampilkan
   * status kosong, bukan data dummy.
   */
  public async getProfileByUserId(userId: string): Promise<HealthProfileEntity | null> {
    return this.findProfileByUserId(userId);
  }
}
