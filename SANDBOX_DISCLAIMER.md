# Batasan demo dan simulasi sandbox

Gunakan naskah 60 detik ini saat slide batasan tampil. Seluruh poin selaras dengan kode backend saat ini.

## Naskah lisan 1 menit untuk presenter

Izin menegaskan batasan demo hari ini. Fitur yang tampil berjalan sebagai simulasi sandbox, bukan integrasi produksi.

Checkout membuat token `snap_token_mock` dan url sandbox vtweb. Tanpa SDK Midtrans dan tanpa charge asli. Fungsi `verifyMidtransSignature` dilonggarkan dan selalu true hanya untuk demo. Fungsi `sendWhatsAppMessage` hanya mencatat ke log server. Tanpa pemanggilan WhatsApp Cloud API dan tanpa pesan terkirim. Kolom `courierProvider` hanya menyimpan string seperti GOSEND_INSTANT atau LALAMOVE. Tanpa integrasi API Lalamove, Gojek, atau Grab dan tanpa optimasi rute. Processor BullMQ berjalan sebagai service NestJS biasa. Tanpa Queue, Worker, atau cron Redis aktif.

Untuk produksi, rencana kami adalah aktivasi Midtrans production key dan webhook Xendit, aktivasi WhatsApp Cloud API dengan template resmi, integrasi API kurir dengan pelacakan dan bukti foto, serta antrean BullMQ di Redis 7. Katalog demo memakai 30 resep aktif fase validasi, dengan 10 menu dari Lampiran 1 UTS.

## Acuan kode

- `backend/src/modules/payments/payments.service.ts`: token `snap_token_mock`, webhook idempoten, `verifyMidtransSignature` selalu true.
- `backend/src/workers/whatsapp-notification.processor.ts`: `sendWhatsAppMessage` hanya log, tanpa post API.
- `backend/prisma/schema.prisma`: `courierProvider` sebagai string enum, tanpa klien API kurir.
- `backend/src/app.module.ts`: processor BullMQ terdaftar sebagai provider biasa, tanpa Queue Redis aktif.
- `backend/src/modules/subscriptions/subscription.service.ts`: pembayaran file memakai `snap_token_mock`.
