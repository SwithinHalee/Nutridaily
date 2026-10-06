import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRISMA_CLIENT } from '../auth/auth.module';
import { SubscriptionService, SubscriptionItem } from '../subscriptions/subscription.service';

export type KDSTicketStatus = 'QUEUED' | 'COOKING' | 'PLATED' | 'PACKED' | 'DISPATCHED';

export interface KDSTicketItem {
  id: string;
  ticketNumber: string;
  orderId: string;
  customerName: string;
  deliverySlot: string; // e.g. "Slot 11.00 - 12.00" | "Slot 12.00 - 13.00"
  recipeTitle: string;
  packageType: string;
  status: KDSTicketStatus;
  grammageDetails?: {
    proteinGrams: number;
    carbsGrams: number;
    vegGrams: number;
    sauceMl: number;
    proteinItem: string;
    carbItem: string;
    vegItem: string;
  };
  specialDietNotes?: string;
  cleanLabelQrCode?: string;
  queuedAt: string;
  cookingStartedAt?: string;
  platedAt?: string;
  packedAt?: string;
  dispatchedAt?: string;

  // Contingency 3: Multi-meal support (Skenario 1 pelanggan memesan lebih dari 1 makanan)
  totalMealsInOrder?: number;
  mealIndex?: number;
  orderGroupId?: string;
  isArchived?: boolean;
  archivedAt?: string;
}

const PAID_STATUSES = ['SETTLEMENT', 'CAPTURE'];

function toSlotLabel(slot: string): string {
  if (slot === 'LUNCH_SLOT_11_12') return 'Slot 11.00 - 12.00';
  if (slot === 'DINNER_SLOT_17_18') return 'Slot 17.00 - 18.00';
  if (slot === 'DINNER_SLOT_18_19') return 'Slot 18.00 - 19.00';
  return slot;
}

const ORDER_STATUS_BY_KDS: Record<KDSTicketStatus, string> = {
  QUEUED: 'PROCESSING',
  COOKING: 'COOKING',
  PLATED: 'READY_TO_DISPATCH',
  PACKED: 'READY_TO_DISPATCH',
  DISPATCHED: 'IN_TRANSIT',
};

@Injectable()
export class KDSService {
  private memoryStatus: Map<string, KDSTicketStatus> = new Map();
  private memoryArchived: Map<string, string> = new Map();
  private memoryTimestamps: Map<string, { cookingStartedAt?: string; platedAt?: string; packedAt?: string; dispatchedAt?: string }> = new Map();

  constructor(
    private readonly subscriptionService: SubscriptionService,
    @Optional() @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient | null = null,
  ) {}

  /**
   * Bangun antrean KDS hanya dari subscription ACTIVE + sudah dibayar + punya pesanan.
   * Tidak lagi memakai antrian mock hardcoded.
   */
  private async buildMemoryTickets(): Promise<KDSTicketItem[]> {
    const all = await this.subscriptionService.getAllSubscriptions();
    const subs = all.filter(
      (s) =>
        s.status === 'ACTIVE' &&
        (s.paymentStatus ? PAID_STATUSES.includes(s.paymentStatus) : false) &&
        s.upcomingOrders.some((o) => !['SKIPPED', 'CANCELLED'].includes(o.status)),
    );

    const tickets: KDSTicketItem[] = [];
    const groups = new Map<string, SubscriptionItem['upcomingOrders']>();
    for (const sub of subs) {
      for (const order of sub.upcomingOrders) {
        if (['SKIPPED', 'CANCELLED', 'DELIVERED'].includes(order.status)) continue;
        const groupKey = `${sub.userId}:${order.orderDate}`;
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey)!.push(order);
        const existing = this.memoryStatus.get(order.id);
        const status: KDSTicketStatus =
          existing ??
          (order.status === 'COOKING'
            ? 'COOKING'
            : order.status === 'READY_TO_DISPATCH'
              ? 'PACKED'
              : order.status === 'IN_TRANSIT'
                ? 'DISPATCHED'
                : 'QUEUED');
        const ts = this.memoryTimestamps.get(order.id) ?? {};
        tickets.push({
          id: `tkt_${order.id}`,
          ticketNumber: `TKT-${order.orderDate.replace(/-/g, '')}-${order.id.slice(-4).toUpperCase()}`,
          orderId: order.id,
          orderGroupId: `ORD-GRP-${sub.id}-${order.orderDate}`,
          customerName: sub.customerName || sub.userId,
          deliverySlot: 'Slot 11.00 - 12.00',
          recipeTitle: order.recipeTitle,
          packageType: sub.packageType,
          status,
          totalMealsInOrder: 1,
          mealIndex: 1,
          queuedAt: new Date().toISOString(),
          cookingStartedAt: ts.cookingStartedAt,
          platedAt: ts.platedAt,
          packedAt: ts.packedAt,
          dispatchedAt: ts.dispatchedAt,
          isArchived: this.memoryArchived.has(order.id),
          archivedAt: this.memoryArchived.get(order.id),
        });
      }
    }

    // Fix totalMealsInOrder/mealIndex per group
    for (const [, orders] of groups) {
      orders.forEach((order, idx) => {
        const t = tickets.find((tkt) => tkt.orderId === order.id);
        if (t) {
          t.totalMealsInOrder = orders.length;
          t.mealIndex = idx + 1;
        }
      });
    }
    return tickets;
  }

  private async syncPrismaTickets(): Promise<void> {
    if (!this.prisma) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const paidOrders = await this.prisma.order.findMany({
      where: {
        orderDate: { gte: todayStart, lt: tomorrowStart },
        status: { in: ['SCHEDULED', 'PROCESSING', 'COOKING', 'READY_TO_DISPATCH', 'IN_TRANSIT'] },
        subscription: { payments: { some: { transactionStatus: { in: PAID_STATUSES as any } } } },
      },
      include: { recipe: true, user: true, address: true, kdsTicket: true, subscription: true },
    });

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

    for (const order of paidOrders) {
      if (order.kdsTicket) continue;
      const seq = Math.floor(1000 + Math.random() * 9000);
      await this.prisma.kDSTicket.create({
        data: {
          orderId: order.id,
          kitchenHubId: hub.id,
          ticketNumber: `TKT-${order.orderDate.toISOString().slice(0, 10).replace(/-/g, '')}-${seq}`,
          grammageDetails: (order.customGrammage ?? {}) as any,
          qrCodeUrl: order.recipe ? `/verify/${order.recipe.qrVerificationCode}` : null,
          status: 'QUEUED',
        },
      });
    }
  }

  private async listPrismaTickets(): Promise<KDSTicketItem[]> {
    if (!this.prisma) return [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const rows = await this.prisma.kDSTicket.findMany({
      where: { order: { orderDate: { gte: todayStart, lt: tomorrowStart } } },
      include: { order: { include: { user: true, recipe: true, subscription: true } } },
      orderBy: { queuedAt: 'asc' },
    });

    // Count meals per customer per day for multi-box badge
    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = `${r.order.userId}:${r.order.orderDate.toISOString().slice(0, 10)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const indexBy = new Map<string, number>();

    return rows.map((r: any) => {
      const key = `${r.order.userId}:${r.order.orderDate.toISOString().slice(0, 10)}`;
      const idx = (indexBy.get(key) ?? 0) + 1;
      indexBy.set(key, idx);
      return {
        id: r.id,
        ticketNumber: r.ticketNumber,
        orderId: r.orderId,
        orderGroupId: `ORD-GRP-${r.order.subscriptionId ?? r.order.userId}-${r.order.orderDate.toISOString().slice(0, 10)}`,
        customerName: r.order.user.fullName,
        deliverySlot: toSlotLabel(r.order.deliverySlot),
        recipeTitle: r.order.recipe.title,
        packageType: r.order.subscription?.packageType ?? 'CUSTOM',
        status: r.status as KDSTicketStatus,
        grammageDetails: (r.grammageDetails as any) ?? undefined,
        specialDietNotes: r.specialDietNotes ?? undefined,
        cleanLabelQrCode: r.order.recipe.qrVerificationCode,
        queuedAt: r.queuedAt.toISOString(),
        cookingStartedAt: r.cookingStartedAt?.toISOString(),
        platedAt: r.platedAt?.toISOString(),
        packedAt: r.packedAt?.toISOString(),
        dispatchedAt: r.dispatchedAt?.toISOString(),
        totalMealsInOrder: counts.get(key) ?? 1,
        mealIndex: idx,
        isArchived: r.isArchived ?? false,
        archivedAt: r.archivedAt ? r.archivedAt.toISOString() : undefined,
      };
    });
  }

  public async getAllTickets(): Promise<KDSTicketItem[]> {
    if (this.prisma) {
      await this.syncPrismaTickets();
      return this.listPrismaTickets();
    }
    return this.buildMemoryTickets();
  }

  public async updateTicketStatus(ticketId: string, nextStatus: KDSTicketStatus): Promise<KDSTicketItem> {
    if (this.prisma) {
      const now = new Date();
      const ticket = await this.prisma.kDSTicket.update({
        where: { id: ticketId },
        data: {
          status: nextStatus,
          ...(nextStatus === 'COOKING' ? { cookingStartedAt: now } : {}),
          ...(nextStatus === 'PLATED' ? { platedAt: now } : {}),
          ...(nextStatus === 'PACKED' ? { packedAt: now } : {}),
          ...(nextStatus === 'DISPATCHED' ? { dispatchedAt: now } : {}),
        },
      });
      await this.prisma.order.update({
        where: { id: ticket.orderId },
        data: { status: ORDER_STATUS_BY_KDS[nextStatus] as any },
      });
      const items = await this.listPrismaTickets();
      const updated = items.find((t) => t.id === ticketId);
      if (!updated) throw new NotFoundException(`Ticket KDS dengan ID ${ticketId} tidak ditemukan.`);
      return updated;
    }

    const tickets = await this.buildMemoryTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new NotFoundException(`Ticket KDS dengan ID ${ticketId} tidak ditemukan.`);

    this.memoryStatus.set(ticket.orderId, nextStatus);
    const ts = this.memoryTimestamps.get(ticket.orderId) ?? {};
    const nowIso = new Date().toISOString();
    if (nextStatus === 'COOKING' && !ts.cookingStartedAt) ts.cookingStartedAt = nowIso;
    if (nextStatus === 'PLATED' && !ts.platedAt) ts.platedAt = nowIso;
    if (nextStatus === 'PACKED' && !ts.packedAt) ts.packedAt = nowIso;
    if (nextStatus === 'DISPATCHED' && !ts.dispatchedAt) ts.dispatchedAt = nowIso;
    this.memoryTimestamps.set(ticket.orderId, ts);

    ticket.status = nextStatus;
    Object.assign(ticket, ts);
    return ticket;
  }

  public async updateOrderGroupStatus(orderGroupId: string, nextStatus: KDSTicketStatus): Promise<KDSTicketItem[]> {
    const tickets = await this.getAllTickets();
    const updated: KDSTicketItem[] = [];
    for (const ticket of tickets) {
      if (ticket.orderGroupId === orderGroupId) {
        updated.push(await this.updateTicketStatus(ticket.id, nextStatus));
      }
    }
    return updated;
  }

  public createBatchTickets(newTickets: KDSTicketItem[]): KDSTicketItem[] {
    for (const t of newTickets) {
      this.memoryStatus.set(t.orderId, t.status);
      this.memoryTimestamps.set(t.orderId, {
        cookingStartedAt: t.cookingStartedAt,
        platedAt: t.platedAt,
        packedAt: t.packedAt,
        dispatchedAt: t.dispatchedAt,
      });
    }
    return newTickets;
  }

  public async archiveDispatchedTicket(ticketId: string): Promise<KDSTicketItem> {
    if (this.prisma) {
      const now = new Date();
      await this.prisma.kDSTicket.update({
        where: { id: ticketId },
        data: { isArchived: true, archivedAt: now },
      });
      const items = await this.listPrismaTickets();
      const found = items.find((t) => t.id === ticketId);
      if (!found) throw new NotFoundException(`Ticket KDS dengan ID ${ticketId} tidak ditemukan.`);
      return found;
    }
    const tickets = await this.buildMemoryTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new NotFoundException(`Ticket KDS dengan ID ${ticketId} tidak ditemukan.`);
    this.memoryArchived.set(ticket.orderId, new Date().toISOString());
    ticket.isArchived = true;
    return ticket;
  }

  public async archiveAllDispatched(): Promise<KDSTicketItem[]> {
    const tickets = await this.getAllTickets();
    const archived: KDSTicketItem[] = [];
    for (const ticket of tickets) {
      if (ticket.status === 'DISPATCHED' && !ticket.isArchived) {
        archived.push(await this.archiveDispatchedTicket(ticket.id));
      }
    }
    return archived;
  }

  public async restoreArchivedTicket(ticketId: string): Promise<KDSTicketItem> {
    if (this.prisma) {
      await this.prisma.kDSTicket.update({
        where: { id: ticketId },
        data: { isArchived: false, archivedAt: null },
      });
      const items = await this.listPrismaTickets();
      const found = items.find((t) => t.id === ticketId);
      if (!found) throw new NotFoundException(`Ticket KDS dengan ID ${ticketId} tidak ditemukan.`);
      return found;
    }
    const tickets = await this.buildMemoryTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new NotFoundException(`Ticket KDS dengan ID ${ticketId} tidak ditemukan.`);
    this.memoryArchived.delete(ticket.orderId);
    ticket.isArchived = false;
    return ticket;
  }
}
