import { HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Aes256GcmUtil } from '../../common/crypto/aes256.util';
import { ApiException } from '../../common/errors/api.exception';
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

export interface HealthProfileHistoryEntity {
  id: string;
  healthProfileId: string;
  userId: string;
  version: number;
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
  changeReason?: string | null;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdAt: Date;
}

@Injectable()
export class HealthProfileService {
  // Fallback RAM hanya saat DATABASE_URL tidak diset (dev tanpa Postgres).
  private profiles = new Map<string, HealthProfileEntity>();
  private historyRecords = new Map<string, HealthProfileHistoryEntity[]>();

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
    // UU PDP No. 27/2022 Bab 11.2: storing body and health data requires explicit consent.
    // Reads stay open (right of access). The in-memory fallback has no user store, so the
    // check only runs against Postgres where User.dataConsentAt is authoritative.
    if (this.prisma) {
      const owner = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { dataConsentAt: true },
      });
      if (!owner || !owner.dataConsentAt) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'CONSENT_REQUIRED',
          'Penyimpanan profil kesehatan memerlukan persetujuan eksplisit penggunaan data tubuh menurut UU PDP No. 27/2022. Berikan persetujuan di halaman pendaftaran atau pengaturan akun.',
        );
      }
    }

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
      // SCD Tipe 2: Catat riwayat versi pada tabel bayangan HealthProfileHistory
      const latestHistory = await this.prisma.healthProfileHistory.findFirst({
        where: { healthProfileId: row.id },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (latestHistory?.version ?? 0) + 1;
      const now = new Date();

      if (latestHistory && !latestHistory.effectiveTo) {
        await this.prisma.healthProfileHistory.update({
          where: { id: latestHistory.id },
          data: { effectiveTo: now },
        });
      }

      await this.prisma.healthProfileHistory.create({
        data: {
          healthProfileId: row.id,
          userId,
          version: nextVersion,
          heightCm: row.heightCm,
          weightKg: row.weightKg,
          age: row.age,
          gender: row.gender,
          activityLevel: row.activityLevel,
          tdeeKcal: row.tdeeKcal,
          targetCalories: row.targetCalories,
          targetProteinGrams: row.targetProteinGrams,
          targetCarbsGrams: row.targetCarbsGrams,
          targetFatGrams: row.targetFatGrams,
          allergies: row.allergies,
          medicalConditions: row.medicalConditions,
          encryptedMedicalNotes: row.encryptedMedicalNotes,
          changeReason: nextVersion === 1 ? 'INITIAL_REGISTRATION' : 'TDEE_RECALCULATION',
          effectiveFrom: now,
          effectiveTo: null,
        },
      });

      const profile = HealthProfileService.toEntity(row, data.confidentialMedicalNotes);
      return { profile, macroBreakdown };
    }

    const profileId = 'hp_' + userId;
    const now = new Date();
    const profile: HealthProfileEntity = {
      id: profileId,
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
      createdAt: now,
      updatedAt: now,
    };

    this.profiles.set(userId, profile);

    // Rekam versi in-memory fallback
    const existingList = this.historyRecords.get(userId) || [];
    const nextVersion = existingList.length + 1;
    if (existingList.length > 0) {
      existingList[existingList.length - 1].effectiveTo = now;
    }
    const historyItem: HealthProfileHistoryEntity = {
      id: 'hph_' + userId + '_v' + nextVersion,
      healthProfileId: profileId,
      userId,
      version: nextVersion,
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
      decryptedMedicalNotes: data.confidentialMedicalNotes,
      changeReason: nextVersion === 1 ? 'INITIAL_REGISTRATION' : 'TDEE_RECALCULATION',
      effectiveFrom: now,
      effectiveTo: null,
      createdAt: now,
    };
    existingList.push(historyItem);
    this.historyRecords.set(userId, existingList);

    return {
      profile: {
        ...profile,
        decryptedMedicalNotes: data.confidentialMedicalNotes,
      },
      macroBreakdown,
    };
  }

  public async getProfileHistory(userId: string): Promise<HealthProfileHistoryEntity[]> {
    if (this.prisma) {
      const rows = await this.prisma.healthProfileHistory.findMany({
        where: { userId },
        orderBy: { version: 'asc' },
      });
      return rows.map((h) => {
        let decrypted: string | undefined;
        if (h.encryptedMedicalNotes) {
          try {
            decrypted = Aes256GcmUtil.decrypt(h.encryptedMedicalNotes);
          } catch {
            decrypted = '[Gagal mendekripsi catatan medis]';
          }
        }
        return {
          id: h.id,
          healthProfileId: h.healthProfileId,
          userId: h.userId,
          version: h.version,
          heightCm: h.heightCm,
          weightKg: h.weightKg,
          age: h.age,
          gender: h.gender as Gender,
          activityLevel: h.activityLevel as ActivityLevel,
          tdeeKcal: h.tdeeKcal,
          targetCalories: h.targetCalories,
          targetProteinGrams: h.targetProteinGrams,
          targetCarbsGrams: h.targetCarbsGrams,
          targetFatGrams: h.targetFatGrams,
          allergies: h.allergies,
          medicalConditions: h.medicalConditions,
          encryptedMedicalNotes: h.encryptedMedicalNotes ?? undefined,
          decryptedMedicalNotes: decrypted,
          changeReason: h.changeReason,
          effectiveFrom: h.effectiveFrom,
          effectiveTo: h.effectiveTo,
          createdAt: h.createdAt,
        };
      });
    }

    return this.historyRecords.get(userId) || [];
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
