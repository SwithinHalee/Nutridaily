import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppNotificationProcessor } from './whatsapp-notification.processor';

export interface PaymentWebhookJobData {
  orderId: string;
  transactionStatus: string;
  grossAmount: number;
  paymentType: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  subscriptionPlan: string;
  paidAt: string;
}

@Injectable()
export class PaymentWebhookProcessor {
  private readonly logger = new Logger(PaymentWebhookProcessor.name);
  private processedOrderIds = new Set<string>();

  constructor(private readonly whatsAppProcessor: WhatsAppNotificationProcessor) {}

  public async processPaymentJob(jobData: PaymentWebhookJobData) {
    this.logger.log(`[BullMQ Worker] Processing payment webhook job for Order: ${jobData.orderId}`);

    // Idempotency check
    if (this.processedOrderIds.has(jobData.orderId)) {
      this.logger.warn(`[BullMQ Worker] Order ${jobData.orderId} was already processed. Skipping duplicate job.`);
      return { status: 'SKIPPED_DUPLICATE' };
    }

    if (jobData.transactionStatus === 'SETTLED' || jobData.transactionStatus === 'settlement' || jobData.transactionStatus === 'capture') {
      this.logger.log(`[BullMQ Worker] Payment verified for order: ${jobData.orderId}. Activating subscription...`);

      // 1. Mark subscription as ACTIVE
      // 2. Schedule daily meal orders in DB
      this.processedOrderIds.add(jobData.orderId);

      // 3. Trigger WhatsApp Confirmation & Invoice Delivery
      await this.whatsAppProcessor.sendPaymentSuccessNotification({
        phone: jobData.customerPhone,
        customerName: jobData.customerName,
        invoiceNumber: jobData.orderId,
        amountFormatted: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(jobData.grossAmount),
        planName: jobData.subscriptionPlan,
        invoicePdfUrl: `https://nutridaily.id/invoices/${jobData.orderId}.pdf`,
      });

      return { status: 'ACTIVATED', orderId: jobData.orderId };
    }

    return { status: 'UNHANDLED_STATUS', orderId: jobData.orderId };
  }
}
