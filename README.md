# NutriDaily Indonesia

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Tests](https://img.shields.io/badge/Tests-52%2F52_passed-2C4A3E?logo=jest&logoColor=white)](https://jestjs.io/)
[![Compliance](https://img.shields.io/badge/UU_PDP-No._27%2F2022-D96B43)](https://peraturan.go.id/)

Platform katering sehat D2C berbasis langganan dengan kalkulator TDEE klinis, antrean dapur sentral (KDS) real-time, dan enkripsi data medis UU PDP No. 27/2022.

---

## Arsitektur sistem

Sistem memisahkan akses publik dan operasional internal secara fisik:

* **Frontend publik (Port 3000)**: Aplikasi Next.js 14 App Router untuk katalog menu, kalkulator TDEE, manajemen langganan, dan pemindaian kode QR Clean Label.
* **Backend & operasional internal (Port 4000)**: Server NestJS 10 untuk REST API, WebSocket gateway, layar tablet dapur KDS (`/kds`), dan portal tele-gizi admin (`/admin`).

```
[ Browser Konsumen ] -> Port 3000 (Next.js 14 Frontend)
                              |
                        REST API (JSON)
                              v
[ Tablet Dapur KDS ] -> Port 4000 (NestJS Backend + WebSocket)
                              |
                    +---------+---------+
                    |                   |
               PostgreSQL 16         Redis 7
              (Data Persisten)    (BullMQ Queue)
```

---

## Tumpukan teknologi

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, TanStack Query, Framer Motion
* **Backend**: NestJS 10, Express, Socket.io (WebSocket), BullMQ, Prisma ORM
* **Basis data & antrean**: PostgreSQL 16, Redis 7
* **Keamanan**: Enkripsi AES-256-GCM (data medis), Argon2id / Bcrypt (kata sandi)
* **Pengujian**: Jest, ts-jest (52 test case)
* **Infrastruktur**: Docker Compose, NGINX

---

## Cara menjalankan aplikasi

### Prasyarat
* Node.js >= 20.x
* NPM >= 9.x
* Docker Desktop (opsional, untuk database kontainer lokal)

### 1. Pasang dependensi
```bash
git clone https://github.com/nutridaily/nutridaily.git
cd nutridaily
npm install
npm run install:all
```

### 2. Siapkan database
Jalankan PostgreSQL dan Redis lokal di latar belakang:
```bash
npm run db:up
```

Salin variabel lingkungan backend:
```bash
cp backend/.env.example backend/.env
```

*(Catatan: Bila `DATABASE_URL` tidak didefinisikan, backend otomatis menggunakan penyimpanan lokal `backend/data/*.store.json`).*

### 3. Jalankan server
Jalankan frontend dan backend sekaligus dari root:
```bash
npm run dev
```

Aplikasi dapat dibuka di browser:
* Pelanggan publik: `http://localhost:3000`
* Layar dapur KDS: `http://localhost:4000/kds`
* Portal admin & tele-gizi: `http://localhost:4000/admin`
* Gateway internal: `http://localhost:4000/`

---

## Fitur utama dan aturan bisnis

1. **Kalkulator TDEE klinis**: Menghitung kalori basal (formula Mifflin-St Jeor) dan membagi gramatur makronutrisi harian berdasarkan target tubuh.
2. **Aturan cutoff 20.00 WIB**: Perubahan menu dan jeda langganan untuk pengantaran H+1 dikunci setiap pukul 20.00 WIB untuk persiapan bahan baku segar.
3. **Layar dapur KDS real-time**: Alur kanban tiket dapur berbasis drag-and-drop dengan sinkronisasi WebSocket, mode kepadatan 2 kolom, dan peringatan suara Web Audio API.
4. **Clean Label & uji lab**: Verifikasi bahan pangan petani lokal dan nomor sertifikasi laboratorium via kode QR pada setiap boks makanan.
5. **Kepatuhan UU PDP No. 27/2022**: Riwayat medis dan alergi dienkripsi menggunakan AES-256-GCM sebelum disimpan ke basis data.

---

## Pengujian

Jalankan seluruh pengujian unit logika bisnis dan keamanan:

```bash
npm test
```

Mencakup 52 pengujian:
* `tdee-calculator.spec.ts` (kalkulasi metabolisme dan makronutrisi)
* `cutoff-rule.spec.ts` (aturan batas waktu 20.00 WIB)
* `recipe-availability.spec.ts` (ketersediaan menu harian)
* `auth-security.spec.ts` (rotasi token sesi dan proteksi keamanan)

---

## Struktur direktori

```
nutridaily/
├── backend/
│   ├── prisma/              # Skema basis data (schema.prisma)
│   ├── src/
│   │   ├── internal-views/  # Template server-rendered KDS dan Admin
│   │   ├── modules/         # Modul auth, gizi, langganan, kds, resep, pembayaran
│   │   └── workers/         # BullMQ processor (cron 05.00 WIB dan webhook)
│   └── test/                # Unit test Jest
├── frontend/
│   └── src/app/             # Halaman pelanggan publik Next.js App Router
├── docker-compose.yml       # Konfigurasi kontainer PostgreSQL, Redis, NGINX
└── package.json             # Skrip root workspace
```

---

## Lisensi

Hak Cipta (c) 2026 NutriDaily Indonesia. Seluruh hak cipta dilindungi undang-undang.
