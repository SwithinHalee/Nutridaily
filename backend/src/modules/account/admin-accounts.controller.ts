import { Controller, Get, HttpStatus, Inject } from '@nestjs/common';
import { AUTH_REPOSITORY, AuthRepository } from '../auth/repository/auth.repository';
import { HealthProfileService } from '../health-profile/health-profile.service';

@Controller('api/v1/admin')
export class AdminAccountsController {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepository,
    private readonly healthProfiles: HealthProfileService,
  ) {}

  @Get('crm')
  async listCrm() {
    const users = await this.repo.listUsers();
    const rows = await Promise.all(
      users.map(async (u) => {
        const profile = await this.healthProfiles.findProfileByUserId(u.id).catch(() => null);
        const refDate = u.lastLoginAt ?? u.createdAt;
        const daysSinceActive = Math.max(
          0,
          Math.floor((Date.now() - new Date(refDate).getTime()) / 86400000),
        );
        const recencyLabel =
          daysSinceActive <= 0 ? 'Hari ini' : daysSinceActive === 1 ? '1 Hari Lalu' : `${daysSinceActive} Hari Lalu`;
        const accountAgeDays = Math.max(
          0,
          Math.floor((Date.now() - new Date(u.createdAt).getTime()) / 86400000),
        );
        const frequencyLabel =
          accountAgeDays < 1
            ? 'Baru bergabung hari ini'
            : accountAgeDays < 30
              ? `${accountAgeDays} hari aktif`
              : `${Math.floor(accountAgeDays / 30)} bulan aktif`;
        let segment = 'TERDAFTAR';
        let segmentTone: 'neutral' | 'loyal' | 'risk' = 'neutral';
        if (u.deletedAt) {
          segment = 'DIHAPUS';
          segmentTone = 'risk';
        } else if (!u.isVerified) {
          segment = 'BELUM VERIFIKASI';
          segmentTone = 'risk';
        } else if (daysSinceActive <= 3) {
          segment = 'AKTIF';
          segmentTone = 'loyal';
        } else if (daysSinceActive > 14) {
          segment = 'JARANG AKTIF';
          segmentTone = 'risk';
        }
        const teleGiziParts: string[] = [];
        if (profile) {
          if (typeof profile.targetCalories === 'number')
            teleGiziParts.push(`Target ${Math.round(profile.targetCalories)} kkal/hari`);
          if (profile.allergies?.length) teleGiziParts.push(`Alergi: ${profile.allergies.join(', ')}`);
          if (profile.medicalConditions?.length)
            teleGiziParts.push(`Riwayat: ${profile.medicalConditions.join(', ')}`);
          if (profile.decryptedMedicalNotes) teleGiziParts.push(profile.decryptedMedicalNotes);
        }
        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          role: u.role,
          isVerified: u.isVerified,
          segment,
          segmentTone,
          recency: recencyLabel,
          recencyDays: daysSinceActive,
          frequency: frequencyLabel,
          monetary: null,
          teleGizi: teleGiziParts.length
            ? teleGiziParts.join('. ')
            : 'Belum ada rekam gizi. Minta pelanggan isi kalkulator TDEE.',
          hasHealthProfile: !!profile,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        };
      }),
    );
    return {
      statusCode: HttpStatus.OK,
      message: `${rows.length} pelanggan ditemukan dari data akun terdaftar.`,
      data: rows,
    };
  }

  @Get('accounts')
  async listAccounts() {
    const users = await this.repo.listUsers();
    return {
      statusCode: HttpStatus.OK,
      message: `${users.length} akun terdaftar ditemukan.`,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        fullName: u.fullName,
        role: u.role,
        isVerified: u.isVerified,
        emailVerifiedAt: u.emailVerifiedAt ? u.emailVerifiedAt.toISOString() : null,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        failedLoginCount: u.failedLoginCount,
        lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
        tokenVersion: u.tokenVersion,
        passwordChangedAt: u.passwordChangedAt ? u.passwordChangedAt.toISOString() : null,
        deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    };
  }
}
