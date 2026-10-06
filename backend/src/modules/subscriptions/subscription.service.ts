import { Injectable, BadRequestException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { PrismaClient } from '@prisma/client';
import { PRISMA_CLIENT } from '../auth/auth.module';
import { CutoffValidator } from './cutoff-validator';

export interface SubscriptionItem {
  id: string;
  userId: string;
  packageType: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  paymentStatus?: 'SETTLEMENT' | 'CAPTURE' | 'PENDING' | 'DENY' | 'CANCEL' | 'EXPIRE' | 'REFUND';
  customerName?: string;
  deliveryAddress: {
    id: string;
    label: string;
    fullAddress: string;
  };
  upcomingOrders: Array<{
    id: string;
    orderDate: string; // YYYY-MM-DD
    mealType: 'LUNCH' | 'DINNER';
    recipeId: string;
    recipeTitle: string;
    status: string;
  }>;
}

function toDateKey(v: Date | string): string {
  const d = v instanceof Date ? v : new Date(v);
  return d.toISOString().split('T')[0];
}

@Injectable()
export class SubscriptionService {
  // Penyimpanan file JSON untuk pengembangan tanpa Postgres.
  // Saat DATABASE_URL diset, seluruh baca/tulis lewat Prisma (permanen).
  private subscriptions: Map<string, SubscriptionItem> = new Map();
  private readonly storePath = SubscriptionService.resolveStorePath('subscriptions.store.json');

  constructor(@Optional() @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient | null = null) {
    this.loadStore();
  }

  static resolveStorePath(fileName: string): string {
    const candidates = [
      join(process.cwd(), 'backend', 'data', fileName),
      join(process.cwd(), 'data', fileName),
      join(__dirname, '..', '..', '..', 'data', fileName),
    ];
    for (const p of candidates) {
      try {
        if (existsSync(p)) return p;
      } catch {
        // abaikan, coba kandidat berikut
      }
    }
    return candidates[0];
  }

  private loadStore(): void {
    try {
      if (!existsSync(this.storePath)) return;
      const raw = JSON.parse(readFileSync(this.storePath, 'utf8')) as SubscriptionItem[];
      if (!Array.isArray(raw)) return;
      for (const sub of raw) {
        if (sub && typeof sub.id === 'string') this.subscriptions.set(sub.id, sub);
      }
    } catch {
      // File rusak atau belum ada. Mulai dari penyimpanan kosong.
    }
  }

  private persistStore(): void {
    try {
      mkdirSync(dirname(this.storePath), { recursive: true });
      writeFileSync(this.storePath, JSON.stringify(Array.from(this.subscriptions.values()), null, 2), 'utf8');
    } catch {
      // Gagal tulis tidak boleh menggagalkan request. Data tetap di memori.
    }
  }

  private mapPrismaSubscription(row: any): SubscriptionItem {
    const orders = (row.orders ?? []).map((o: any) => ({
      id: o.id,
      orderDate: toDateKey(o.orderDate),
      mealType: o.mealType as 'LUNCH' | 'DINNER',
      recipeId: o.recipeId,
      recipeTitle: o.recipe?.title ?? o.recipeId,
      status: o.status,
    }));
    const payments = row.payments ?? [];
    const paid = payments.some((p: any) => ['SETTLEMENT', 'CAPTURE'].includes(p.transactionStatus));
    return {
      id: row.id,
      userId: row.userId,
      packageType: row.packageType,
      durationDays: row.durationDays,
      startDate: toDateKey(row.startDate),
      endDate: toDateKey(row.endDate),
      status: row.status as SubscriptionItem['status'],
      paymentStatus: paid ? 'SETTLEMENT' : 'PENDING',
      customerName: row.user?.fullName ?? row.userId,
      deliveryAddress: {
        id: row.deliveryAddress?.id ?? row.deliveryAddressId,
        label: row.deliveryAddress?.label ?? 'Alamat',
        fullAddress: row.deliveryAddress?.fullAddress ?? '-',
      },
      upcomingOrders: orders,
    };
  }

  public async getAllSubscriptions(): Promise<SubscriptionItem[]> {
    if (this.prisma) {
      const rows = await this.prisma.subscription.findMany({
        include: {
          deliveryAddress: true,
          user: { select: { fullName: true } },
          orders: { include: { recipe: { select: { title: true } } }, orderBy: { orderDate: 'asc' } },
          payments: { select: { transactionStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((r) => this.mapPrismaSubscription(r));
    }
    return Array.from(this.subscriptions.values());
  }

  public async getSubscription(subId: string): Promise<SubscriptionItem> {
    if (this.prisma) {
      const row = await this.prisma.subscription.findUnique({
        where: { id: subId },
        include: {
          deliveryAddress: true,
          user: { select: { fullName: true } },
          orders: { include: { recipe: { select: { title: true } } }, orderBy: { orderDate: 'asc' } },
          payments: { select: { transactionStatus: true } },
        },
      });
      if (!row) {
        throw new NotFoundException(`Langganan dengan ID ${subId} tidak ditemukan.`);
      }
      return this.mapPrismaSubscription(row);
    }
    const sub = this.subscriptions.get(subId);
    if (!sub) {
      throw new NotFoundException(`Langganan dengan ID ${subId} tidak ditemukan.`);
    }
    return sub;
  }

  /**
   * Ambil langganan milik user. Jika belum ada, buatkan baris nyata di
   * database dari resep aktif yang ada di database (bukan judul hardcode),
   * sehingga seluruh data tampil berasal dari database dan permanen.
   */
  public async getOrCreateUserSubscription(userId: string): Promise<SubscriptionItem> {
    if (this.prisma) {
      const existing = await this.prisma.subscription.findFirst({
        where: { userId },
        include: {
          deliveryAddress: true,
          user: { select: { fullName: true } },
          orders: { include: { recipe: { select: { title: true } } }, orderBy: { orderDate: 'asc' } },
          payments: { select: { transactionStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) return this.mapPrismaSubscription(existing);
      return this.provisionPrismaSubscription(userId);
    }

    for (const sub of this.subscriptions.values()) {
      if (sub.userId === userId) {
        return sub;
      }
    }
    return this.provisionFileSubscription(userId);
  }

  private async provisionPrismaSubscription(userId: string): Promise<SubscriptionItem> {
    if (!this.prisma) throw new Error('Prisma tidak tersedia.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const recipes = await this.prisma.recipe.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    const firstDeliveryStr = CutoffValidator.getNextDeliveryDateStr(new Date());
    const secondDeliveryStr = CutoffValidator.getNextDeliveryDateStr(new Date(`${firstDeliveryStr}T12:00:00Z`));
    const startDate = new Date(`${firstDeliveryStr}T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const address = await this.prisma.address.create({
      data: {
        userId,
        label: 'Kantor',
        recipientName: user?.fullName ?? 'Pelanggan',
        phoneNumber: user?.phone ?? '-',
        fullAddress: 'Pacific Century Place Lt. 18, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
        latitude: -6.2254,
        longitude: 106.8091,
        notes: 'Titip di resepsionis lobi',
        isPrimary: true,
      },
    });

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        packageType: 'WEIGHT_LOSS_LEAN_SCULPT',
        durationDays: 20,
        mealSchedule: 'LUNCH',
        startDate,
        endDate,
        status: 'ACTIVE',
        deliveryAddressId: address.id,
        autoRenew: true,
        pricePerDay: 45000,
        totalAmount: 900000,
      },
    });

    const dates = [firstDeliveryStr, secondDeliveryStr];
    for (let i = 0; i < dates.length; i++) {
      const recipe = recipes[i % Math.max(recipes.length, 1)];
      if (!recipe) break;
      await this.prisma.order.create({
        data: {
          subscriptionId: subscription.id,
          userId,
          orderDate: new Date(`${dates[i]}T00:00:00.000Z`),
          mealType: 'LUNCH',
          deliverySlot: 'LUNCH_SLOT_11_12',
          recipeId: recipe.id,
          addressId: address.id,
          status: 'SCHEDULED',
        },
      });
    }

    return this.getSubscription(subscription.id);
  }

  private provisionFileSubscription(userId: string): SubscriptionItem {
    const firstDeliveryStr = CutoffValidator.getNextDeliveryDateStr(new Date());
    const secondDeliveryStr = CutoffValidator.getNextDeliveryDateStr(
      new Date(`${firstDeliveryStr}T12:00:00Z`),
    );

    const subId = `sub_${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'active'}`;
    const newSub: SubscriptionItem = {
      id: subId,
      userId,
      packageType: 'WEIGHT_LOSS_LEAN_SCULPT',
      durationDays: 20,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-11-01',
      status: 'ACTIVE',
      paymentStatus: 'SETTLEMENT',
      deliveryAddress: {
        id: 'addr_default',
        label: 'Kantor',
        fullAddress: 'Pacific Century Place Lt. 18, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
      },
      upcomingOrders: [],
    };
    this.subscriptions.set(subId, newSub);
    this.persistStore();
    void firstDeliveryStr;
    void secondDeliveryStr;
    return newSub;
  }

  /**
   * Pause subscription starting from targetDate.
   * Enforces 20:00 WIB Cutoff rule for tomorrow's delivery.
   */
  public async pauseSubscription(subId: string, effectiveDate: string): Promise<SubscriptionItem> {
    CutoffValidator.assertModificationAllowed(effectiveDate);
    if (this.prisma) {
      await this.prisma.subscription.update({ where: { id: subId }, data: { status: 'PAUSED' } });
      return this.getSubscription(subId);
    }
    const sub = await this.getSubscription(subId);
    sub.status = 'PAUSED';
    this.persistStore();
    return sub;
  }

  /**
   * Resume paused subscription
   */
  public async resumeSubscription(subId: string, resumeDate: string): Promise<SubscriptionItem> {
    CutoffValidator.assertModificationAllowed(resumeDate);
    if (this.prisma) {
      await this.prisma.subscription.update({ where: { id: subId }, data: { status: 'ACTIVE' } });
      return this.getSubscription(subId);
    }
    const sub = await this.getSubscription(subId);
    sub.status = 'ACTIVE';
    this.persistStore();
    return sub;
  }

  /**
   * Swap menu for a specific date
   * Validates target delivery date against 20.00 WIB cutoff
   */
  public async swapMenu(
    subId: string,
    orderDate: string,
    newRecipe: { id: string; title: string }
  ): Promise<SubscriptionItem> {
    CutoffValidator.assertModificationAllowed(orderDate);
    if (this.prisma) {
      const target = await this.prisma.order.findFirst({
        where: { subscriptionId: subId, orderDate: new Date(`${orderDate}T00:00:00.000Z`) },
      });
      if (!target) {
        throw new BadRequestException(`Tidak ada jadwal pengiriman pesanan pada tanggal ${orderDate}.`);
      }
      await this.prisma.recipe.findUniqueOrThrow({ where: { id: newRecipe.id } });
      await this.prisma.order.update({ where: { id: target.id }, data: { recipeId: newRecipe.id } });
      return this.getSubscription(subId);
    }
    const sub = await this.getSubscription(subId);
    const order = sub.upcomingOrders.find((o) => o.orderDate === orderDate);
    if (!order) {
      throw new BadRequestException(`Tidak ada jadwal pengiriman pesanan pada tanggal ${orderDate}.`);
    }
    order.recipeId = newRecipe.id;
    order.recipeTitle = newRecipe.title;
    this.persistStore();
    return sub;
  }

  /**
   * Skip meal for a specific date
   */
  public async skipMeal(subId: string, orderDate: string): Promise<SubscriptionItem> {
    CutoffValidator.assertModificationAllowed(orderDate);
    if (this.prisma) {
      const target = await this.prisma.order.findFirst({
        where: { subscriptionId: subId, orderDate: new Date(`${orderDate}T00:00:00.000Z`) },
      });
      if (!target) {
        throw new BadRequestException(`Tidak ada jadwal pesanan yang dapat di-skip pada ${orderDate}.`);
      }
      await this.prisma.order.update({ where: { id: target.id }, data: { status: 'SKIPPED' } });
      return this.getSubscription(subId);
    }
    const sub = await this.getSubscription(subId);
    const order = sub.upcomingOrders.find((o) => o.orderDate === orderDate);
    if (!order) {
      throw new BadRequestException(`Tidak ada jadwal pesanan yang dapat di-skip pada ${orderDate}.`);
    }
    order.status = 'SKIPPED';
    this.persistStore();
    return sub;
  }

  /**
   * Change delivery address for upcoming meals
   */
  public async updateDeliveryAddress(
    subId: string,
    effectiveDate: string,
    newAddress: { id: string; label: string; fullAddress: string }
  ): Promise<SubscriptionItem> {
    CutoffValidator.assertModificationAllowed(effectiveDate);
    if (this.prisma) {
      const sub = await this.prisma.subscription.findUnique({ where: { id: subId } });
      if (!sub) throw new NotFoundException(`Langganan dengan ID ${subId} tidak ditemukan.`);
      await this.prisma.address.update({
        where: { id: sub.deliveryAddressId },
        data: { label: newAddress.label, fullAddress: newAddress.fullAddress },
      });
      return this.getSubscription(subId);
    }
    const current = await this.getSubscription(subId);
    current.deliveryAddress = newAddress;
    this.persistStore();
    return current;
  }
}
