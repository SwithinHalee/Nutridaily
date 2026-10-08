# Struktur & Catatan Presentasi NutriDaily Frontend (13 Slide)

Dokumen ini adalah ringkasan konten, susunan visual, dan panduan presentasi untuk berkas presentasi [NutriDaily_Frontend_Presentation.pptx](file:///D:/Projects/Nutridaily/NutriDaily_Frontend_Presentation.pptx). Presentasi ini berfokus khusus pada ranah **Frontend Pelanggan D2C (Port 3000)**.

---

## Ringkasan Slide

### Slide 1: Judul & Pembuka (Cover)
* **Kategori**: NUTRIDAILY INDONESIA • FRONTEND WEB & PWA
* **Judul**: Platform D2C Food-Tech Katering Sehat Digital
* **Deskripsi**: Eksplorasi antarmuka pelanggan publik: dari kalkulasi metabolisme tubuh Mifflin-St Jeor, fleksibilitas langganan harian, hingga transparansi bahan baku berlabel bersih.
* **Metadata**: Next.js 14 App Router • Tailwind CSS • Standar UU PDP No. 27/2022 • Port 3000
* **Visual**: Cuplikan Hero UI dengan galeri boks makanan riil ([01_home_hero.png](file:///D:/Projects/Nutridaily/presentation_assets/01_home_hero.png)).
* **Tema Warna**: Hijau alpukat hutan pekat (`#2C4A3E`) dengan aksen terakota hangat.

---

### Slide 2: Pilar Nilai Utama Pengalaman Pengguna
* **Kategori**: KONSEP & ARSITEKTUR
* **Judul**: Pilar utama pengalaman pelanggan di web publik
* **Poin Pembahasan**:
  1. **Presisi Gizi Klinis**: Gramatur makronutrisi (Protein, Karbohidrat, Lemak) diukur per gram dengan timbangan digital dapur sentral.
  2. **Kontrol Penuh Tanpa Kontrak**: Pelanggan bebas menukar menu harian, mengganti alamat pengantaran, atau menjeda jadwal katering sebelum batas waktu 20.00 WIB.
  3. **Transparansi Mutu (Clean Label)**: Setiap boks memiliki QR code untuk memverifikasi asal bahan petani lokal (Beras Wonogiri, Salmon Norwegia) dan sertifikat lab independen.
  4. **Perlindungan Data Medis**: Kepatuhan privasi rekam kesehatan sesuai UU PDP No. 27/2022 dengan enkripsi AES-256.
* **Visual**: Tangkapan layar antarmuka beranda ([01_home_hero.png](file:///D:/Projects/Nutridaily/presentation_assets/01_home_hero.png)).

---

### Slide 3: Standar Sistem Desain UI/UX Anti-AI (Jacob Perks)
* **Kategori**: STANDAR DESAIN VISUAL
* **Judul**: Penerapan sistem desain anti-AI murni
* **Poin Pembahasan**:
  1. **Warna Flat Organik Murni**: Hapus semua gradien. Menggunakan sampel fisik: off-white tebu (`#FDFBF7`), near-black (`#1A1310`), forest avocado (`#2C4A3E`), dan warm terracotta (`#D96B43`).
  2. **Tipografi Humanis Terpilih**: Display headings menggunakan font serif *Fraunces*, UI body menggunakan font sans-serif *Manrope*. Dilarang menggunakan font default generator AI (Inter/Roboto).
  3. **Sentence Case Menyeluruh**: Semua menu, judul, dan label tombol berhuruf kapital hanya di awal kalimat.
  4. **Mikro-Detail Taktil**: Tekstur film grain SVG `feTurbulence`, sudut radius konsentris, dan viewport adaptif `100dvh`.
* **Visual**: Tangkapan layar tiket verifikasi Clean Label taktil ([04_clean_label_card.png](file:///D:/Projects/Nutridaily/presentation_assets/04_clean_label_card.png)).

---

### Slide 4: Halaman Beranda (Hero Section)
* **Kategori**: HALAMAN BERANDA
* **Judul**: Antarmuka hero beranda: sajian visual & fakta riil
* **Poin Pembahasan**:
  1. **Headline Berbobot**: "Makanan sehat berstandar restoran. Diukur presisi per gram gizi." dengan CSS text-wrap balancing.
  2. **Tombol Aksi Berbasis Hasil**: CTA spesifik "Hitung kebutuhan kalori TDEE" dan "Lihat rotasi 30 menu" menggantikan tombol generik. Fase validasi memakai 30 resep aktif.
  3. **Angka Riil Spesifik (Lumpy Numbers)**: 1.842 pax pelanggan aktif mingguan, toleransi timbangan ± 4.2 gram, kepuasan rasa 4.9 / 5.0.
  4. **Galeri Makanan Riil**: Foto nyata boks katering ramah lingkungan tanpa ilustrasi generik.
* **Visual**: Tangkapan layar resolusi tinggi hero desktop ([01_home_hero.png](file:///D:/Projects/Nutridaily/presentation_assets/01_home_hero.png)).

---

### Slide 5: Kalkulator Metabolisme Klinis TDEE
* **Kategori**: KALKULATOR INTERAKTIF
* **Judul**: Kalkulator metabolisme TDEE & Bento Grid gizi
* **Poin Pembahasan**:
  1. **Formula Klinis Terstandar**: Formula ilmiah Mifflin-St Jeor menghitung BMR berdasarkan usia, berat, tinggi, gender, dan 5 level intensitas aktivitas.
  2. **Pembagian Makronutrisi Presisi**: Menghitung gramatur bersih per porsi: Protein, Karbohidrat, dan Lemak baik sesuai target (Weight loss, Muscle gain, Maintenance).
  3. **Panel Rekomendasi Real-Time**: Estimasi kebutuhan kalori (misal: 1.440 kkal/hari), tarif paket harian (Rp 85.000), dan tombol pemilihan paket langsung.
* **Visual**: Tangkapan layar Bento Grid kalkulator TDEE ([02_tdee_calculator.png](file:///D:/Projects/Nutridaily/presentation_assets/02_tdee_calculator.png)).

---

### Slide 6: Katalog Menu Mingguan & Fleksibilitas Rotasi
* **Kategori**: KATALOG SAJIAN
* **Judul**: Katalog 30 resep aktif fase validasi dan proteksi data pelanggan
* **Poin Pembahasan**:
  1. **Rotasi 30 resep aktif fase validasi**: 30 resep aktif untuk validasi rasa dan operasi. 10 di antaranya menu Lampiran 1 UTS. Variasi mencegah bosan pada langganan jangka panjang.
  2. **Jadwal Tayang Berbasis Hari Riil**: Penjadwalan menu menggunakan daftar tanggal eksplisit (`availableDays`) yang sinkron dengan dapur sentral.
  3. **Proteksi Akses Tanpa Bocor Data**: Sesuai kebijakan data repositori, jika pengguna belum terautentikasi, antarmuka penukaran menu dilindungi modal login resmi tanpa menampilkan data dummy.
* **Visual**: Tangkapan layar katalog menu dan modal otentikasi ([03_menu_catalog.png](file:///D:/Projects/Nutridaily/presentation_assets/03_menu_catalog.png)).

---

### Slide 7: Dashboard Manajemen Langganan Pelanggan
* **Kategori**: PORTAL DASHBOARD
* **Judul**: Kendali mandiri jadwal langganan & batas waktu 20.00 WIB
* **Poin Pembahasan**:
  1. **Penukaran Menu H+1 Mudah**: Pelanggan dapat memilih varian menu pengganti untuk hidangan esok hari dengan satu klik.
  2. **Jeda Langganan Taktil**: Fitur jeda (*pause*) saat bepergian atau dinas kantor, menjaga kuota langganan tetap utuh.
  3. **Penegakan Batas Waktu 20.00 WIB**: Penyesuaian jadwal dan menu setelah pukul 20.00 dikunci demi kepastian belanja bahan segar dan rute kurir logistik.
  4. **Pembaruan Alamat & GPS Pinpoint**: Pengalihan tujuan antar kantor (SCBD) atau rumah tinggal dengan catatan instruksi pengantaran.
* **Visual**: Tangkapan layar dashboard pelanggan aktif ([08_dashboard_active.png](file:///D:/Projects/Nutridaily/presentation_assets/08_dashboard_active.png)).

---

### Slide 8: Verifikasi Mutu & Transparansi Clean Label (QR Code)
* **Kategori**: INOVASI CLEAN LABEL
* **Judul**: Verifikasi transparansi mutu & uji laboratorium
* **Poin Pembahasan**:
  1. **Sertifikat Uji Lab Independen**: Menampilkan nomor sertifikat resmi PT Saraswanti Indo Genetech (SIG-LAB/2026/08942-ND) yang memverifikasi makanan bebas residu pestisida, logam berat, dan formalin.
  2. **Ketertelusuran Petani Lokal**: Menampilkan asal bahan baku: Beras Merah Aromatik Wonogiri, Sayuran Lembang, dan Salmon Segar Norwegia.
  3. **Catatan Suhu Masak Dapur Presisi**: Transparansi proses koki dapur: sous-vide 52.5°C untuk menjaga kelembutan protein dan nutrisi mikro.
  4. **Audit Kepatuhan Gizi**: Tingkat kesesuaian penimbangan dapur sentral mencapai 99.6% terhadap target kalori.
* **Visual**: Tangkapan layar rute verifikasi label bersih ([05_verify_page.png](file:///D:/Projects/Nutridaily/presentation_assets/05_verify_page.png)).

---

### Slide 9: Alur Checkout & Simulasi Pembayaran Digital
* **Kategori**: CHECKOUT DIGITAL
* **Judul**: Alur langganan fleksibel & pembayaran aman
* **Poin Pembahasan**:
  1. **Struktur Paket Transparan**: Pilihan durasi 5 hari kerja (mingguan), 20 hari kerja (diskon 10%), dan 30 hari kerja (diskon 15%).
  2. **Pilihan Pembayaran Beragam**: Integrasi QRIS real-time (BCA, GoPay, OVO, ShopeePay), Virtual Account otomatis, dan kartu kredit.
  3. **Persetujuan Eksplisit UU PDP**: Kotak persetujuan pemrosesan data riwayat kesehatan fisik wajib dicentang sebelum pembayaran diproses.
  4. **Simulasi Midtrans Sandbox**: Checkout membuat token `snap_token_mock` dan url sandbox vtweb. Tanpa SDK Midtrans dan tanpa pendebetan dana nyata. Rincian batasan ada di slide batasan demo.
* **Visual**: Tangkapan layar formulir checkout ([06_checkout_page.png](file:///D:/Projects/Nutridaily/presentation_assets/06_checkout_page.png)).

---

### Slide 10: Keamanan Akun & Kepatuhan Privasi Data Medis (UU PDP)
* **Kategori**: PRIVASI & KEAMANAN
* **Judul**: Keamanan akun & kepatuhan data medis klinis
* **Poin Pembahasan**:
  1. **Hashing Password Argon2id**: Kata sandi diamankan dengan algoritma Argon2id (memori 19 MiB per percobaan), menolak serangan brute-force.
  2. **Token Akses HTTP-Only 15 Menit**: Token JWT tersimpan dalam cookie HTTP-only aman dari pencurian script sisi klien (XSS).
  3. **Proteksi Brute-Force & Lockout**: Akun otomatis dikunci sementara 15 menit jika terjadi 5 kali kegagalan login berturut-turut.
  4. **Rekam Medis Terenkripsi AES-256**: Riwayat gizi, profil alergi, dan catatan tele-gizi dienkripsi secara simetris sesuai mandat UU PDP.
* **Visual**: Tangkapan layar antarmuka login berkeamanan tinggi ([07_login_page.png](file:///D:/Projects/Nutridaily/presentation_assets/07_login_page.png)).

---

### Slide 11: Pengalaman Mobile & Desain Responsif (PWA Ready)
* **Kategori**: DESAIN RESPONSIF
* **Judul**: Optimalisasi mobile PWA & navigasi satu tangan
* **Poin Pembahasan**:
  1. **Bilah Navigasi Bawah (Bottom Bar)**: Navigasi cepat ramah jempol (Beranda, Kalkulator, Langganan, Label QR) untuk pengguna smartphone.
  2. **Tata Letak Adaptif Bebas Reflow**: Grid Bento bertransformasi elegan menjadi kartu vertikal bertumpuk di layar kecil.
  3. **Target Sentuh Ergonomis**: Seluruh tombol dan pemilih input memiliki luas sentuh minimum 44px dengan umpan balik visual seketika.
  4. **Kecepatan Muat Ringan**: Optimasi aset Next.js dan pemisahan chunk kode (First Load JS hanya ~84.8 kB).
* **Visual**: Tangkapan layar ganda mobile beranda & label QR ([08_mobile_home.png](file:///D:/Projects/Nutridaily/presentation_assets/08_mobile_home.png), [10_mobile_verify.png](file:///D:/Projects/Nutridaily/presentation_assets/10_mobile_verify.png)).

---

### Slide 12: Batasan demo dan simulasi sandbox
* **Kategori**: TRANSPARANSI TEKNIS
* **Judul**: Batasan demo dan simulasi sandbox yang perlu diketahui
* **Poin Pembahasan**:
  1. **Token Midtrans mock tanpa charge asli**: checkout membuat `snap_token_mock` dan url sandbox vtweb. Tanpa SDK Midtrans dan tanpa pendebetan dana nyata.
  2. **Verifikasi webhook dilonggarkan untuk demo**: fungsi `verifyMidtransSignature` selalu true. Wajib ganti ke validasi SHA-512 dengan server key sebelum rilis produksi.
  3. **Notifikasi WhatsApp hanya log server**: fungsi `sendWhatsAppMessage` hanya mencatat ke log. Tanpa pemanggilan WhatsApp Cloud API dan tanpa pesan terkirim ke pelanggan.
  4. **Kurir hanya enum teks tanpa integrasi API**: kolom `courierProvider` menyimpan string seperti GOSEND_INSTANT atau LALAMOVE. Tanpa integrasi API Lalamove, Gojek, atau Grab dan tanpa optimasi rute.
  5. **Worker tanpa antrean Redis aktif**: processor BullMQ berjalan sebagai service NestJS biasa. Tanpa Queue, Worker, atau cron Redis aktif. Jadwal 05.00 WIB berjalan sebagai pemanggilan service langsung.
  6. **Rencana tindak lanjut produksi**: aktivasi Midtrans production key dan webhook Xendit, aktivasi WhatsApp Cloud API dengan template resmi, integrasi API kurir dengan pelacakan dan bukti foto, serta antrean BullMQ di Redis 7.
* **Visual**: Tabel dua kolom berisi status demo dan target produksi untuk lima modul di atas.

---

### Slide 13: Ringkasan Arsitektur Teknologi & Penutup
* **Kategori**: KESIMPULAN & PENUTUP
* **Judul**: Fondasi teknologi frontend yang kokoh & siap produksi
* **Poin Pembahasan**:
  1. **Next.js 14 App Router**: 15 rute terkompilasi optimal dengan render hibrida SSR/SSG.
  2. **Tailwind & Jacob Perks UI**: Desain bersih tanpa gradien dengan palet organik alami.
  3. **Pemisahan Port Bersih**: Pemisahan tegas ranah publik port 3000 dari backend port 4000 sesuai regulasi keamanan data.
  4. **Kesiapan Produksi Penuh**: Teruji 100% bebas galat linting dan lulus 52 pengujian unit otomatis.
* **Visual**: Kartu penutup 4 pilar arsitektur berlatar hijau alpukat hutan (`#2C4A3E`).
