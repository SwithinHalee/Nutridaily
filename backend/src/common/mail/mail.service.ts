import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { authConfig } from '../../config/auth.config';

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface DevOutboxEntry extends OutgoingMail {
  sentAt: string;
  link?: string;
}

/** Escapes user-controlled values before they are placed in HTML email bodies. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="id"><body style="margin:0;background:#FDFBF7;font-family:Manrope,Segoe UI,sans-serif;color:#1A1310">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<p style="font-size:12px;color:#2C4A3E;font-weight:600;margin:0 0 8px">NutriDaily Indonesia</p>
<h1 style="font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:600;margin:0 0 16px">${escapeHtml(title)}</h1>
${bodyHtml}
<p style="font-size:11px;color:#7A6E66;margin-top:32px">Email ini dikirim otomatis. Jangan teruskan email ini kepada siapa pun. Tim NutriDaily tidak pernah meminta kata sandi Anda.</p>
</div></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#2C4A3E;color:#FDFBF7;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px">${escapeHtml(label)}</a></p>
<p style="font-size:12px;color:#7A6E66;word-break:break-all">Jika tombol tidak berfungsi, salin tautan ini ke peramban: ${escapeHtml(href)}</p>`;
}

/**
 * Sends transactional email via SMTP when SMTP_HOST is configured. Otherwise (development)
 * it prints the message to the console, and optionally keeps it in an in-memory outbox.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private readonly transporter: nodemailer.Transporter | null;
  private readonly outbox: DevOutboxEntry[] = [];

  constructor() {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = authConfig.mail;
    this.transporter = smtpHost
      ? nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
          requireTLS: !smtpSecure,
        })
      : null;
  }

  get transportName(): string {
    return this.transporter ? `SMTP ${authConfig.mail.smtpHost}` : 'console (development)';
  }

  /** Fire-and-forget so response timing never depends on whether an email was sent. */
  dispatch(mail: OutgoingMail, link?: string): void {
    this.send(mail, link).catch((err: Error) => {
      this.logger.error(`Gagal mengirim email "${mail.subject}": ${err.message}`);
    });
  }

  async send(mail: OutgoingMail, link?: string): Promise<void> {
    if (this.transporter) {
      await this.transporter.sendMail({ from: authConfig.mail.from, ...mail });
      return;
    }
    if (authConfig.mail.devOutboxEnabled) {
      this.outbox.unshift({ ...mail, link, sentAt: new Date().toISOString() });
      this.outbox.length = Math.min(this.outbox.length, 50);
    }
    this.logger.log(
      `\n----- Email (mode pengembangan, tidak benar-benar dikirim) -----\nKepada : ${mail.to}\nSubjek : ${mail.subject}\n${link ? `Tautan : ${link}\n` : ''}----------------------------------------------------------------`,
    );
  }

  getDevOutbox(): DevOutboxEntry[] {
    return authConfig.mail.devOutboxEnabled ? [...this.outbox] : [];
  }

  // ---------- Templates ----------

  verificationEmail(to: string, fullName: string, link: string, ttlHours: number): OutgoingMail {
    return {
      to,
      subject: 'Verifikasi email akun NutriDaily Anda',
      text: `Halo ${fullName},\n\nKlik tautan berikut untuk memverifikasi email Anda (berlaku ${ttlHours} jam):\n${link}\n\nJika Anda tidak mendaftar, abaikan email ini.`,
      html: layout(
        'Verifikasi email Anda',
        `<p style="font-size:14px;line-height:1.6">Halo ${escapeHtml(fullName)}, satu langkah lagi untuk mengaktifkan akun NutriDaily. Tautan berlaku ${ttlHours} jam dan hanya bisa dipakai satu kali.</p>${button(link, 'Verifikasi email saya')}<p style="font-size:13px;color:#7A6E66">Jika Anda tidak mendaftar, abaikan email ini.</p>`,
      ),
    };
  }

  accountExistsEmail(to: string, loginLink: string, resetLink: string): OutgoingMail {
    return {
      to,
      subject: 'Percobaan pendaftaran dengan email Anda',
      text: `Seseorang mencoba mendaftar NutriDaily memakai email ini, padahal akun sudah ada.\nMasuk: ${loginLink}\nLupa kata sandi: ${resetLink}\nJika bukan Anda, abaikan email ini.`,
      html: layout(
        'Email Anda sudah terdaftar',
        `<p style="font-size:14px;line-height:1.6">Seseorang mencoba membuat akun baru memakai email ini. Akun Anda tetap aman dan tidak ada perubahan.</p>${button(loginLink, 'Masuk ke akun')}<p style="font-size:13px">Lupa kata sandi? <a href="${escapeHtml(resetLink)}" style="color:#2C4A3E">Atur ulang di sini</a>.</p>`,
      ),
    };
  }

  phoneConflictEmail(to: string): OutgoingMail {
    return {
      to,
      subject: 'Pendaftaran NutriDaily belum dapat diselesaikan',
      text: 'Nomor WhatsApp yang Anda masukkan sudah terhubung dengan akun lain. Gunakan nomor lain atau hubungi layanan pelanggan NutriDaily.',
      html: layout(
        'Pendaftaran belum selesai',
        '<p style="font-size:14px;line-height:1.6">Nomor WhatsApp yang Anda masukkan sudah terhubung dengan akun NutriDaily lain. Silakan daftar ulang dengan nomor berbeda, atau hubungi layanan pelanggan jika nomor tersebut milik Anda.</p>',
      ),
    };
  }

  passwordResetEmail(to: string, fullName: string, link: string, ttlMinutes: number): OutgoingMail {
    return {
      to,
      subject: 'Atur ulang kata sandi NutriDaily',
      text: `Halo ${fullName},\n\nAtur ulang kata sandi melalui tautan berikut (berlaku ${ttlMinutes} menit, sekali pakai):\n${link}\n\nJika Anda tidak meminta ini, abaikan email ini. Kata sandi Anda tidak berubah.`,
      html: layout(
        'Atur ulang kata sandi',
        `<p style="font-size:14px;line-height:1.6">Halo ${escapeHtml(fullName)}, kami menerima permintaan atur ulang kata sandi. Tautan berlaku ${ttlMinutes} menit dan hanya bisa dipakai satu kali.</p>${button(link, 'Buat kata sandi baru')}<p style="font-size:13px;color:#7A6E66">Jika Anda tidak meminta ini, abaikan email ini. Kata sandi Anda tidak berubah.</p>`,
      ),
    };
  }

  passwordChangedEmail(to: string, fullName: string, resetLink: string): OutgoingMail {
    return {
      to,
      subject: 'Kata sandi NutriDaily Anda telah diubah',
      text: `Halo ${fullName},\n\nKata sandi akun Anda baru saja diubah dan semua sesi lama telah dikeluarkan.\nJika bukan Anda, segera atur ulang: ${resetLink}`,
      html: layout(
        'Kata sandi berhasil diubah',
        `<p style="font-size:14px;line-height:1.6">Halo ${escapeHtml(fullName)}, kata sandi akun Anda baru saja diubah. Demi keamanan, semua perangkat lain telah dikeluarkan dari akun.</p><p style="font-size:13px">Bukan Anda? <a href="${escapeHtml(resetLink)}" style="color:#D96B43;font-weight:600">Atur ulang kata sandi sekarang</a>.</p>`,
      ),
    };
  }

  accountDeletedEmail(to: string, fullName: string): OutgoingMail {
    return {
      to,
      subject: 'Akun NutriDaily Anda telah dihapus',
      text: `Halo ${fullName},\n\nAkun NutriDaily Anda telah dihapus. Data pribadi dan rekam gizi telah dianonimkan sesuai UU PDP No. 27/2022. Faktur pajak disimpan sesuai kewajiban hukum.`,
      html: layout(
        'Akun Anda telah dihapus',
        `<p style="font-size:14px;line-height:1.6">Halo ${escapeHtml(fullName)}, akun NutriDaily Anda telah dihapus. Data pribadi dan rekam gizi medis telah dianonimkan sesuai UU PDP No. 27/2022. Faktur pembayaran tetap disimpan sesuai kewajiban perpajakan.</p>`,
      ),
    };
  }
}
