# Panduan menjalankan database Docker via terminal VS Code

Dokumen ini memuat panduan lengkap untuk menyalakan dan mengelola database kontainer (**PostgreSQL 16** dan **Redis 7**) langsung dari terminal atau PowerShell di VS Code tanpa perlu membuka jendela aplikasi Docker Desktop secara manual.

---

## 1. Ringkasan solusi

Pada sistem operasi Windows, Docker Desktop memiliki engine latar belakang yang dapat dijalankan secara hening tanpa menampilkan dashboard antarmuka grafis (GUI).

Proyek ini telah dilengkapi dengan skrip otomatisasi di [scripts/start-db.js](file:///D:/Projects/Nutridaily/scripts/start-db.js) dan shortcut di [package.json](file:///D:/Projects/Nutridaily/package.json), sehingga seluruh siklus hidup database dapat dikendalikan dengan satu perintah terminal.

---

## 2. Cara tercepat: Perintah npm di terminal

Buka terminal PowerShell terintegrasi di VS Code pada root folder `Nutridaily`, lalu gunakan perintah berikut:

### Menyalakan database
```powershell
npm run db:up
```
* **Fungsi**: Memeriksa status Docker engine. Jika belum aktif, skrip akan membangunkan Docker Desktop di latar belakang secara otomatis, menunggu hingga engine siap, lalu menjalankan kontainer PostgreSQL dan Redis dalam mode *detached* (latar belakang).

### Memeriksa status kontainer
```powershell
npm run db:status
```
* **Fungsi**: Menampilkan daftar kontainer yang sedang berjalan beserta status kesehatannya (*healthcheck*).

### Memantau log database PostgreSQL
```powershell
npm run db:logs
```
* **Fungsi**: Menampilkan rekaman log PostgreSQL secara langsung (*stream*). Tekan `Ctrl + C` untuk keluar dari pemantauan log tanpa mematikan database.

### Menghentikan database saat selesai bekerja
```powershell
npm run db:down
```
* **Fungsi**: Menghentikan kontainer PostgreSQL dan Redis dengan aman.

---

## 3. Cara manual: Perintah Docker CLI di PowerShell

Jika Anda memilih mengetik perintah bawaan Docker langsung tanpa npm scripts:

1. **Membangunkan engine Docker di latar belakang**:
   ```powershell
   docker desktop start -d
   ```

2. **Menjalankan hanya kontainer PostgreSQL dan Redis**:
   ```powershell
   docker compose up -d postgres redis
   ```

3. **Mengecek status kontainer**:
   ```powershell
   docker compose ps
   ```

4. **Menghentikan kontainer**:
   ```powershell
   docker compose stop postgres redis
   ```

---

## 4. Informasi koneksi database lokal

Konfigurasi koneksi sudah diselaraskan dengan berkas [backend/.env](file:///D:/Projects/Nutridaily/backend/.env) dan [docker-compose.yml](file:///D:/Projects/Nutridaily/docker-compose.yml):

| Parameter | PostgreSQL 16 | Redis 7 |
| :--- | :--- | :--- |
| **Host** | `localhost` | `localhost` |
| **Port** | `5432` | `6379` |
| **Database** | `nutridaily_db` | - |
| **Username** | `nutridaily_user` | - |
| **Password** | `nutridaily_secure_password_2026` | - |
| **Volume Penyimpanan** | `postgres_data` | `redis_data` |

Data di dalam database bersifat persisten dan tidak akan hilang meskipun kontainer dihentikan atau komputer dimatikan.

---

## 5. Tips optimasi startup Windows (tanpa jendela GUI)

Agar Anda sama sekali tidak perlu menunggu engine Docker menyala setiap kali mulai bekerja di VS Code:

1. Buka aplikasi **Docker Desktop** sekali saja.
2. Klik ikon gerigi (**Settings**) di pojok kanan atas.
3. Pada tab **General**:
   - Centang opsi: **"Start Docker Desktop when you log in"**.
   - Hilangkan centang opsi: **"Open Docker Dashboard at startup"**.
4. Klik tombol **Apply & restart**.

Setelah setelan ini aktif, engine Docker akan selalu siap di latar belakang sistem (tray Windows) setiap kali Anda masuk ke Windows, sehingga perintah `npm run db:up` atau `npm run dev` dapat langsung berjalan seketika.

---

## 6. Penanganan kendala umum

### Galat koneksi pipe `open //./pipe/dockerDesktopLinuxEngine`
* **Penyebab**: Docker Desktop belum sempat siap saat perintah dikirim.
* **Solusi**: Jalankan `npm run db:up`. Skrip ini memiliki mekanisme tunggu otomatis hingga koneksi pipe Docker siap menerima perintah.

### Database berjalan tetapi backend tidak dapat terhubung
* **Solusi**: Pastikan port 5432 tidak sedang digunakan oleh instalasi PostgreSQL lokal lain di Windows (non-kontainer). Anda dapat memeriksa port dengan perintah:
  ```powershell
  Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
  ```
