import { Injectable, Logger } from '@nestjs/common';

export interface WhatsAppPaymentPayload {
  phone: string;
  customerName: string;
  invoiceNumber: string;
  amountFormatted: string;
  planName: string;
  invoicePdfUrl: string;
}

export interface WhatsAppDispatchPayload {
  phone: string;
  customerName: string;
  mealTitle: string;
  courierName: string;
  driverName: string;
  trackingUrl: string;
  serviceRecoveryClaimUrl: string;
}

export interface WhatsAppCutoffReminderPayload {
  phone: string;
  customerName: string;
  tomorrowMealTitle: string;
  dashboardUrl: string;
}

@Injectable()
export class WhatsAppNotificationProcessor {
  private readonly logger = new Logger(WhatsAppNotificationProcessor.name);
  private readonly apiUrl = 'https://graph.facebook.com/v19.0';
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || 'demo_wa_phone_id';
  private readonly accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || 'demo_token';

  /**
   * Dispatches WhatsApp notification via WhatsApp Business Cloud API
   */
  private async sendWhatsAppMessage(toPhone: string, templateName: string, bodyText: string): Promise<boolean> {
    const formattedPhone = toPhone.startsWith('0') ? '62' + toPhone.slice(1) : toPhone.replace('+', '');

    this.logger.log(
      `[WhatsApp API Dispatch] Sending template "${templateName}" to ${formattedPhone}:\n${bodyText}`
    );

    // In production:
    // await axios.post(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
    //   messaging_product: 'whatsapp',
    //   to: formattedPhone,
    //   type: 'text',
    //   text: { body: bodyText }
    // }, { headers: { Authorization: `Bearer ${this.accessToken}` } });

    return true;
  }

  public async sendPaymentSuccessNotification(payload: WhatsAppPaymentPayload) {
    const message = `Halo ${payload.customerName}! 🥗✨\n\nPembayaran langganan NutriDaily Anda telah berhasil dikonfirmasi.\n\n` +
      `📄 *No. Invoice:* ${payload.invoiceNumber}\n` +
      `📦 *Paket:* ${payload.planName}\n` +
      `💳 *Total:* ${payload.amountFormatted}\n\n` +
      `Unduh faktur resmi (PDF) Anda di sini: ${payload.invoicePdfUrl}\n\n` +
      `Koki dan tim ahli gizi kami mulai menyiapkan menu terpersonalisasi Anda. Salam sehat bugar! 💪`;

    return this.sendWhatsAppMessage(payload.phone, 'payment_success_invoice', message);
  }

  public async sendCutoffReminderNotification(payload: WhatsAppCutoffReminderPayload) {
    const message = `Halo ${payload.customerName}! ⏰ Pengingat Cutoff NutriDaily\n\n` +
      `Menu Anda untuk besok siang:\n` +
      `🍱 *${payload.tomorrowMealTitle}*\n\n` +
      `Ingin *Swap Menu, Skip Meal, Pause*, atau *Ganti Alamat*?\n` +
      `Batas waktu perubahan adalah malam ini pukul *20.00 WIB* (tersisa kurang dari 2 jam).\n\n` +
      `Atur jadwal dengan mudah via Dashboard PWA Anda: ${payload.dashboardUrl}`;

    return this.sendWhatsAppMessage(payload.phone, 'daily_cutoff_reminder', message);
  }

  public async sendDeliveryDispatchNotification(payload: WhatsAppDispatchPayload) {
    const message = `Makanan Sehat Anda Sedang Diantar! 🛵💨\n\n` +
      `Halo ${payload.customerName}, menu *${payload.mealTitle}* baru saja diambil oleh kurir *${payload.courierName}* (Driver: ${payload.driverName}).\n\n` +
      `📍 *Live Tracking Kurir:* ${payload.trackingUrl}\n\n` +
      `🛡️ *Garansi Service Recovery 45 Menit:* Jika makanan terlambat lebih dari 45 menit atau mengalami tumpah/kerusakan, laporkan langsung di sini: ${payload.serviceRecoveryClaimUrl}`;

    return this.sendWhatsAppMessage(payload.phone, 'order_dispatched_tracking', message);
  }
}
