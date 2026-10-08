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
  totalAmount?: number;
  pricePerDay?: number;
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
  allSubscriptions?: SubscriptionItem[];
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
      totalAmount: row.totalAmount != null ? Number(row.totalAmount) : undefined,
      pricePerDay: row.pricePerDay != null ? Number(row.pricePerDay) : undefined,
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

  public async getUserSubscriptions(userId: string): Promise<SubscriptionItem[]> {
    if (this.prisma) {
      const rows = await this.prisma.subscription.findMany({
        where: { userId },
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
    return Array.from(this.subscriptions.values()).filter((s) => s.userId === userId);
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
        where: { userId, status: 'ACTIVE' },
        include: {
          deliveryAddress: true,
          user: { select: { fullName: true } },
          orders: { include: { recipe: { select: { title: true } } }, orderBy: { orderDate: 'asc' } },
          payments: { select: { transactionStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const allSubs = await this.getUserSubscriptions(userId);
      if (existing) {
        const item = this.mapPrismaSubscription(existing);
        item.allSubscriptions = allSubs;
        return item;
      }
      const anySub = await this.prisma.subscription.findFirst({
        where: { userId },
        include: {
          deliveryAddress: true,
          user: { select: { fullName: true } },
          orders: { include: { recipe: { select: { title: true } } }, orderBy: { orderDate: 'asc' } },
          payments: { select: { transactionStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (anySub) {
        const item = this.mapPrismaSubscription(anySub);
        item.allSubscriptions = allSubs;
        return item;
      }
      const created = await this.provisionPrismaSubscription(userId);
      created.allSubscriptions = [created];
      return created;
    }

    const userSubs = Array.from(this.subscriptions.values()).filter((s) => s.userId === userId);
    if (userSubs.length > 0) {
      const active = userSubs.find((s) => s.status === 'ACTIVE') || userSubs[userSubs.length - 1];
      active.allSubscriptions = userSubs;
      return active;
    }
    const createdFile = this.provisionFileSubscription(userId);
    createdFile.allSubscriptions = [createdFile];
    return createdFile;
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

    const invoiceNumber = `ND-INV-${subscription.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        invoiceNumber,
        amount: subscription.totalAmount,
        paymentType: 'MIDTRANS_SNAP',
        transactionStatus: 'SETTLEMENT',
        paidAt: new Date(),
        snapToken: `snap_token_mock_${invoiceNumber}`,
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

  public async activateSubscription(params: {
    userId: string;
    packageType: string;
    durationDays: number;
    totalAmount: number;
    scheduleMode?: 'ROLLOVER' | 'PARALLEL';
    deliveryAddress?: { label?: string; fullAddress?: string };
    paymentStatus?: 'SETTLEMENT' | 'CAPTURE' | 'PENDING';
  }): Promise<SubscriptionItem> {
    if (this.prisma) {
      let user = await this.prisma.user.findUnique({ where: { id: params.userId } });
      if (!user) {
        user = await this.prisma.user.findFirst();
      }
      const actualUserId = user?.id || params.userId;

      let address = await this.prisma.address.findFirst({ where: { userId: actualUserId } });
      if (!address) {
        address = await this.prisma.address.create({
          data: {
            userId: actualUserId,
            label: params.deliveryAddress?.label || 'Kantor SCBD Pacific Century Tower Lt. 18',
            recipientName: user?.fullName || 'Joshua Abdiel',
            phoneNumber: user?.phone || '+6281292570602',
            fullAddress: params.deliveryAddress?.fullAddress || 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
            latitude: -6.2254,
            longitude: 106.8091,
            isPrimary: true,
          },
        });
      } else if (params.deliveryAddress?.fullAddress) {
        address = await this.prisma.address.update({
          where: { id: address.id },
          data: {
            label: params.deliveryAddress.label || address.label,
            fullAddress: params.deliveryAddress.fullAddress,
          },
        });
      }

      let sub = await this.prisma.subscription.findFirst({
        where: { userId: actualUserId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });

      if (!sub) {
        sub = await this.prisma.subscription.findFirst({
          where: { userId: actualUserId },
          orderBy: { createdAt: 'desc' },
        });
      }

      const isParallel = params.scheduleMode === 'PARALLEL';
      const isRollover = !isParallel && Boolean(sub && sub.status === 'ACTIVE' && sub.endDate && new Date(sub.endDate) > new Date());

      let startDate: Date;
      let endDate: Date;
      let newDuration: number;
      let newTotalAmount: number;

      if (isParallel || !sub) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.max(params.durationDays, 30));
        newDuration = params.durationDays;
        newTotalAmount = params.totalAmount;

        sub = await this.prisma.subscription.create({
          data: {
            userId: actualUserId,
            packageType: params.packageType as any,
            durationDays: params.durationDays,
            mealSchedule: 'LUNCH',
            startDate,
            endDate,
            status: 'ACTIVE',
            deliveryAddressId: address.id,
            autoRenew: true,
            pricePerDay: Math.round(params.totalAmount / params.durationDays),
            totalAmount: params.totalAmount,
          },
        });
      } else if (isRollover) {
        // Langganan masih aktif: akumulasikan durasi dan nilai total pembayaran
        startDate = new Date(sub.startDate);
        const baseEndDate = new Date(sub.endDate);
        endDate = new Date(baseEndDate);
        endDate.setDate(endDate.getDate() + params.durationDays);
        newDuration = (sub.durationDays || 0) + params.durationDays;
        newTotalAmount = (Number(sub.totalAmount) || 0) + params.totalAmount;

        sub = await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            packageType: params.packageType as any,
            durationDays: newDuration,
            totalAmount: newTotalAmount,
            pricePerDay: Math.round(newTotalAmount / newDuration),
            status: 'ACTIVE',
            endDate,
            deliveryAddressId: address.id,
          },
        });
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.max(params.durationDays, 30));
        newDuration = params.durationDays;
        newTotalAmount = params.totalAmount;

        sub = await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            packageType: params.packageType as any,
            durationDays: params.durationDays,
            totalAmount: params.totalAmount,
            pricePerDay: Math.round(params.totalAmount / params.durationDays),
            status: 'ACTIVE',
            startDate,
            endDate,
            deliveryAddressId: address.id,
          },
        });
      }

      const allRecipes = await this.prisma.recipe.findMany({ where: { isActive: true } });
      const matchedRecipes = allRecipes.filter((r) => r.category === params.packageType);
      const recipePool = matchedRecipes.length > 0 ? matchedRecipes : allRecipes;

      let hub = await this.prisma.kitchenHub.findFirst({ where: { isActive: true } });
      if (!hub) {
        hub = await this.prisma.kitchenHub.create({
          data: {
            name: 'Dapur Sentral Sudirman',
            address: 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
            latitude: -6.225,
            longitude: 106.809,
          },
        });
      }

      let currDate: Date;
      let startCount = 0;

      if (isRollover) {
        const lastOrder = await this.prisma.order.findFirst({
          where: { subscriptionId: sub.id },
          orderBy: { orderDate: 'desc' },
        });
        if (lastOrder) {
          currDate = new Date(lastOrder.orderDate);
          currDate.setUTCDate(currDate.getUTCDate() + 1);
        } else {
          currDate = new Date(startDate);
        }
        startCount = await this.prisma.order.count({
          where: { subscriptionId: sub.id },
        });
      } else {
        if (!isParallel) {
          await this.prisma.order.deleteMany({
            where: { subscriptionId: sub.id, status: 'SCHEDULED' },
          });
        }
        currDate = new Date(startDate);
      }

      let added = 0;
      while (added < Math.min(params.durationDays, 30)) {
        const day = currDate.getUTCDay();
        if (day !== 0 && day !== 6) {
          const r = recipePool[(startCount + added) % Math.max(recipePool.length, 1)];
          if (r) {
            const ord = await this.prisma.order.create({
              data: {
                subscriptionId: sub.id,
                userId: actualUserId,
                orderDate: new Date(currDate),
                mealType: 'LUNCH',
                deliverySlot: 'LUNCH_SLOT_11_12',
                recipeId: r.id,
                addressId: address.id,
                status: !isRollover && added === 0 ? 'PROCESSING' : 'SCHEDULED',
              },
            });

            if (!isRollover && added < 3) {
              const ticketSeq = 1000 + added + (isParallel ? Math.floor(Math.random() * 500) + 100 : 0);
              await this.prisma.kDSTicket.create({
                data: {
                  orderId: ord.id,
                  kitchenHubId: hub.id,
                  ticketNumber: `TKT-${ord.orderDate.toISOString().slice(0, 10).replace(/-/g, '')}-${ticketSeq}`,
                  status: added === 0 ? 'COOKING' : 'QUEUED',
                  qrCodeUrl: r.qrVerificationCode ? `/verify/${r.qrVerificationCode}` : null,
                  grammageDetails: {
                    proteinGrams: 160,
                    carbsGrams: 120,
                    vegGrams: 150,
                    sauceMl: 40,
                    proteinItem: 'Dada Ayam Suwir',
                    carbItem: 'Nasi Merah Organik',
                    vegItem: 'Tumis Buncis & Wortel',
                  },
                },
              });
            }
          }
          added++;
        }
        currDate.setUTCDate(currDate.getUTCDate() + 1);
      }

      return this.getSubscription(sub.id);
    }

    const isFileParallel = params.scheduleMode === 'PARALLEL';
    const subId = isFileParallel
      ? `sub_${params.userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}_${Date.now()}`
      : `sub_${params.userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'active'}`;
    const existingSub = !isFileParallel ? this.subscriptions.get(subId) : undefined;
    if (existingSub && existingSub.status === 'ACTIVE') {
      existingSub.durationDays += params.durationDays;
      const endD = new Date(existingSub.endDate);
      endD.setDate(endD.getDate() + params.durationDays);
      existingSub.endDate = endD.toISOString().split('T')[0];
      this.subscriptions.set(subId, existingSub);
      this.persistStore();
      return existingSub;
    }
    const newSub: SubscriptionItem = {
      id: subId,
      userId: params.userId,
      packageType: params.packageType,
      durationDays: params.durationDays,
      totalAmount: params.totalAmount,
      pricePerDay: Math.round(params.totalAmount / params.durationDays),
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-11-18',
      status: 'ACTIVE',
      paymentStatus: 'SETTLEMENT',
      deliveryAddress: {
        id: 'addr_scbd_01',
        label: params.deliveryAddress?.label || 'Kantor SCBD Pacific Century Tower Lt. 18',
        fullAddress: params.deliveryAddress?.fullAddress || 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
      },
      upcomingOrders: [
        {
          id: `ord_${subId}_01`,
          orderDate: CutoffValidator.getNextDeliveryDateStr(new Date()),
          mealType: 'LUNCH',
          recipeId: 'm1',
          recipeTitle: 'Dada ayam suwir kukus sambal matah kecombrang dengan nasi barley',
          status: 'COOKING',
        },
        {
          id: `ord_${subId}_02`,
          orderDate: '2026-10-08',
          mealType: 'LUNCH',
          recipeId: 'm2',
          recipeTitle: 'Medali tempe dan tahu organik dengan saus edamame tumbuk',
          status: 'SCHEDULED',
        },
      ],
    };
    this.subscriptions.set(subId, newSub);
    this.persistStore();
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
