import { Controller, Get, HttpStatus, Inject, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AUTH_REPOSITORY, AuthRepository } from '../auth/repository/auth.repository';
import { PRISMA_CLIENT } from '../auth/auth.module';
import { HealthProfileService } from '../health-profile/health-profile.service';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionService } from '../subscriptions/subscription.service';

@Controller('api/v1/admin')
export class AdminAccountsController {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepository,
    private readonly healthProfiles: HealthProfileService,
    private readonly paymentsService: PaymentsService,
    @Optional() private readonly subscriptionService: SubscriptionService | null = null,
    @Optional() @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient | null = null,
  ) {}

  @Get('crm')
  async listCrm() {
    const users = await this.repo.listUsers();
    const rows = await Promise.all(
      users.map(async (u) => {
        const profile = await this.healthProfiles.findProfileByUserId(u.id).catch(() => null);

        let totalSpent = 0;
        let transactionCount = 0;
        let latestInvoice = '';
        let activeSubscription: any = null;

        if (this.prisma) {
          const userPayments = await this.prisma.payment.findMany({
            where: {
              userId: u.id,
              transactionStatus: { in: ['SETTLEMENT', 'CAPTURE'] },
            },
            orderBy: { createdAt: 'desc' },
          });
          transactionCount = userPayments.length;
          totalSpent = userPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          if (userPayments[0]) latestInvoice = userPayments[0].invoiceNumber;

          if (transactionCount === 0) {
            const txData = await this.paymentsService.listTransactions();
            const userTxs = (txData.transactions || []).filter(
              (t: any) => t.userId === u.id || t.customerEmail === u.email,
            );
            if (userTxs.length > 0) {
              transactionCount = userTxs.length;
              totalSpent = userTxs.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
              if (userTxs[0]) latestInvoice = userTxs[0].invoiceNumber;
            }
          }

          activeSubscription = await this.prisma.subscription.findFirst({
            where: { userId: u.id, status: 'ACTIVE' },
            orderBy: { updatedAt: 'desc' },
          });
        } else {
          const txData = await this.paymentsService.listTransactions();
          const userTxs = (txData.transactions || []).filter(
            (t: any) => t.userId === u.id || t.customerEmail === u.email,
          );
          transactionCount = userTxs.length;
          totalSpent = userTxs.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
          if (userTxs[0]) latestInvoice = userTxs[0].invoiceNumber;
        }

        if (!activeSubscription && this.subscriptionService) {
          const subs = await this.subscriptionService.getUserSubscriptions(u.id);
          activeSubscription = subs.find((s) => s.status === 'ACTIVE') || null;
        }

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

        let frequencyLabel =
          accountAgeDays < 1
            ? 'Baru bergabung hari ini'
            : accountAgeDays < 30
              ? `${accountAgeDays} hari aktif`
              : `${Math.floor(accountAgeDays / 30)} bulan aktif`;

        if (activeSubscription) {
          frequencyLabel = `${activeSubscription.durationDays} hari kerja (${activeSubscription.packageType})`;
        } else if (transactionCount > 0) {
          frequencyLabel = `${transactionCount} pesanan terkonfirmasi`;
        }

        let segment = 'TERDAFTAR';
        let segmentTone: 'neutral' | 'loyal' | 'risk' = 'neutral';
        if (u.deletedAt) {
          segment = 'DIHAPUS';
          segmentTone = 'risk';
        } else if (totalSpent > 0 || (activeSubscription && activeSubscription.status === 'ACTIVE')) {
          segment = 'CHAMPION';
          segmentTone = 'loyal';
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
        if (activeSubscription) {
          teleGiziParts.push(`Langganan ${activeSubscription.packageType} (${activeSubscription.durationDays} hari kerja) aktif.`);
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
          monetary: totalSpent > 0 ? {
            totalSpent,
            formatted: `Rp ${Math.round(totalSpent).toLocaleString('id-ID')}`,
            count: transactionCount,
            latestInvoice,
          } : null,
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

  @Get('transactions')
  async listTransactions() {
    const data = await this.paymentsService.listTransactions();
    return {
      statusCode: HttpStatus.OK,
      message: `${data.transactions.length} transaksi pembayaran terdaftar.`,
      data,
    };
  }

  @Get('accounts')
  async listAccounts() {
    const users = await this.repo.listUsers();
    const rows = await Promise.all(
      users.map(async (u) => {
        let subscriptionSummary: string | null = null;
        let totalSpent = 0;

        if (this.prisma) {
          const sub = await this.prisma.subscription.findFirst({
            where: { userId: u.id, status: 'ACTIVE' },
            orderBy: { updatedAt: 'desc' },
          });
          if (sub) {
            subscriptionSummary = `${sub.packageType} (${sub.durationDays} hari)`;
          }
          const userPayments = await this.prisma.payment.findMany({
            where: { userId: u.id, transactionStatus: { in: ['SETTLEMENT', 'CAPTURE'] } },
          });
          totalSpent = userPayments.reduce((s, p) => s + (p.amount || 0), 0);
        }

        if (!subscriptionSummary && this.subscriptionService) {
          const subs = await this.subscriptionService.getUserSubscriptions(u.id);
          const activeSub = subs.find((s) => s.status === 'ACTIVE');
          if (activeSub) {
            subscriptionSummary = `${activeSub.packageType} (${activeSub.durationDays} hari)`;
          }
        }
        if (totalSpent === 0) {
          const txData = await this.paymentsService.listTransactions();
          const userTxs = (txData.transactions || []).filter(
            (t: any) => t.userId === u.id || t.customerEmail === u.email,
          );
          totalSpent = userTxs.reduce((s: number, t: any) => s + (t.amount || 0), 0);
        }

        return {
          id: u.id,
          email: u.email,
          phone: u.phone,
          fullName: u.fullName,
          role: u.role,
          isVerified: u.isVerified,
          subscriptionSummary,
          totalSpentFormatted: totalSpent > 0 ? `Rp ${Math.round(totalSpent).toLocaleString('id-ID')}` : null,
          emailVerifiedAt: u.emailVerifiedAt ? u.emailVerifiedAt.toISOString() : null,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
          failedLoginCount: u.failedLoginCount,
          lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
          tokenVersion: u.tokenVersion,
          passwordChangedAt: u.passwordChangedAt ? u.passwordChangedAt.toISOString() : null,
          deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        };
      }),
    );

    return {
      statusCode: HttpStatus.OK,
      message: `${rows.length} akun terdaftar ditemukan.`,
      data: rows,
    };
  }
}

