export function renderPortalHomeView(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NutriDaily Indonesia. Backend & Portal Pegawai Internal</title>
  <link rel="icon" type="image/svg+xml" href="/brand/logo-light.svg">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-base: #FDFBF7;
      --surface: #FFFFFF;
      --surface-subtle: #F7F4EE;
      --border-warm: #DED8CE;
      --text-main: #1A1310;
      --text-muted: #6E665E;
      --forest: #2C4A3E;
      --forest-hover: #233B31;
      --forest-subtle: #EBF0EE;
      --terracotta: #D96B43;
      --font-body: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-display: 'Fraunces', Georgia, serif;
    }
    html, body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    html::-webkit-scrollbar,
    body::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: var(--font-body);
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
      position: relative;
    }
    /* Film grain texture overlay */
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.06;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      z-index: 99;
    }
    h1, h2, h3 { text-wrap: balance; font-weight: 600; letter-spacing: -0.015em; }
    p { text-wrap: pretty; }
    em, i { font-style: normal; font-weight: 500; }

    header {
      background-color: var(--surface);
      border-bottom: 1px solid var(--border-warm);
      padding: 6px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 40;
      min-height: 46px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .brand-badge {
      background-color: var(--forest);
      color: #FDFBF7;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .title-wrap {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .title-row h1 {
      font-size: 15px;
      font-family: var(--font-display);
      color: var(--text-main);
      white-space: nowrap;
    }
    .status-badge {
      font-size: 10px;
      font-family: monospace;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--forest-subtle);
      border: 1px solid rgba(44, 74, 62, 0.25);
      color: var(--forest);
      white-space: nowrap;
      font-weight: 700;
    }
    .subtext {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.2;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .nav-btn {
      background: var(--surface);
      border: 1px solid var(--border-warm);
      color: var(--text-main);
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .nav-btn:hover {
      background: #F7F4EE;
      border-color: var(--forest);
    }
    .nav-btn.active {
      border-color: var(--forest);
      color: var(--forest);
      background: var(--forest-subtle);
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--forest-subtle);
      color: var(--forest);
      letter-spacing: 0.04em;
    }

    main {
      max-width: 980px;
      margin: 36px auto;
      padding: 0 20px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Concentric radius: hero box 14px */
    .hero-box {
      background: var(--surface);
      border: 1px solid var(--border-warm);
      border-radius: 14px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(26, 19, 16, 0.04);
    }
    .hero-title {
      font-size: 24px;
      font-family: var(--font-display);
      color: var(--text-main);
    }
    .hero-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Bento portal launcher grid */
    .portal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 18px;
    }
    .portal-card {
      background: var(--surface);
      border: 1px solid var(--border-warm);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 1px 2px rgba(26, 19, 16, 0.04);
      transition: transform 0.15s, border-color 0.15s;
    }
    .portal-card:hover {
      border-color: var(--forest);
      transform: translateY(-2px);
    }

    /* Small-caps eyebrow without generic icons */
    .eyebrow-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--forest);
      display: block;
    }
    .card-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--text-main);
      font-family: var(--font-display);
    }
    .card-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .card-cta {
      margin-top: auto;
      font-size: 12px;
      font-weight: 700;
      color: var(--forest);
      display: flex;
      align-items: center;
      gap: 4px;
      padding-top: 12px;
      border-top: 1px solid var(--surface-subtle);
    }

    .api-card {
      background: var(--surface);
      border: 1px solid var(--border-warm);
      border-radius: 12px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 1px 2px rgba(26, 19, 16, 0.04);
    }
    .endpoints-list {
      display: flex;
      flex-direction: column;
      gap: 7px;
      font-family: monospace;
      font-size: 12px;
      background: var(--surface-subtle);
      padding: 14px;
      border-radius: 8px;
      border: 1px solid var(--border-warm);
    }
    .method {
      color: var(--forest);
      font-weight: 700;
      width: 55px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-left">
      <div class="brand-badge-logo" title="NutriDaily Indonesia">
        <svg viewBox="0 0 100 100" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NutriDaily Indonesia">
          <circle cx="50" cy="50" r="43" stroke="#2C4A3E" stroke-width="4.5" />
          <path d="M22 52 C 22 71, 34 81, 50 81 C 66 81, 78 71, 78 52 Z" fill="#2C4A3E" />
          <line x1="26" y1="50" x2="74" y2="50" stroke="#FDFBF7" stroke-width="2.5" stroke-linecap="round" />
          <path d="M50 48 C 43 38, 37 26, 50 16 C 58 26, 54 38, 50 48 Z" fill="#2C4A3E" />
          <path d="M52 48 C 58 40, 68 32, 66 18 C 54 22, 52 38, 52 48 Z" fill="#D96B43" />
        </svg>
      </div>
      <div class="title-row">
        <h1>NutriDaily</h1>
        <span class="status-badge">Portal</span>
      </div>
    </div>

    <nav class="header-actions" aria-label="Navigasi portal pegawai">
      <a href="/" class="nav-btn active" title="Beranda portal internal">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>Beranda</span>
      </a>
      <a href="/kds" class="nav-btn" title="Layar dapur sentral (KDS)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="18"></rect><rect x="14" y="3" width="7" height="18"></rect></svg>
        <span>Dapur</span>
      </a>
      <a href="/admin" class="nav-btn" title="Portal admin & tele-gizi">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span>Admin</span>
      </a>
      <a href="http://localhost:3000" target="_blank" class="nav-btn" title="Web pelanggan (Port 3000)">
        <span>Web</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </a>
    </nav>
  </header>

  <main>
    <div class="hero-box">
      <span class="badge" style="width: fit-content;">PEMISAHAN AKSES ARSITEKTUR</span>
      <h2 class="hero-title">Portal Pegawai Internal NutriDaily</h2>
      <p class="hero-desc">
        Antarmuka internal (Layar dapur sentral koki dan Portal tele-nutritionist) dijalankan secara terpusat pada server backend (Port 4000). Aplikasi pelanggan berjalan mandiri pada port 3000.
      </p>
    </div>

    <div class="portal-grid">
      <!-- Portal 1: Layar Dapur Sentral (KDS) -->
      <a href="/kds" class="portal-card">
        <div>
          <span class="eyebrow-tag">Modul Operasional Dapur</span>
          <h3 class="card-title">Layar dapur sentral (KDS)</h3>
        </div>
        <p class="card-desc">
          Antarmuka tablet koki dengan tema gelap kontras tinggi. Dilengkapi sistem pembaruan status drag and drop 3 zone, tata letak ringkas tanpa distraksi gambar, dan penanda waktu pesanan.
        </p>
        <span class="card-cta">
          <span>Buka layar dapur kds</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-left: 4px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </span>
      </a>

      <!-- Portal 2: Portal Admin & Tele-Gizi -->
      <a href="/admin" class="portal-card">
        <div>
          <span class="eyebrow-tag">Modul Konsultasi & Gizi</span>
          <h3 class="card-title">Portal admin & tele-gizi</h3>
        </div>
        <p class="card-desc">
          Manajemen pelanggan RFM, rekam gizi klinis terenkripsi AES-256-GCM (UU PDP), repositori formularium 60 resep lengkap dengan foto makanan, dan log audit transaksi Midtrans.
        </p>
        <span class="card-cta">
          <span>Buka portal admin gizi</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-left: 4px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </span>
      </a>

      <!-- Portal 3: Web Pelanggan D2C -->
      <a href="http://localhost:3000" target="_blank" class="portal-card">
        <div>
          <span class="eyebrow-tag">Portal Eksternal Konsumen</span>
          <h3 class="card-title">Web pelanggan (PWA)</h3>
        </div>
        <p class="card-desc">
          Antarmuka publik untuk pelanggan: Kalkulator metabolisme TDEE, pemilihan paket menu mingguan, swap resep, dan verifikasi tiket uji laboratorium SIG.
        </p>
        <span class="card-cta">
          <span>Buka web pelanggan (Port 3000)</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-left: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </span>
      </a>
    </div>

    <div class="api-card">
      <h3 style="font-size: 14px; font-weight: 700;">Status API & Gateway Real-time</h3>
      <div class="endpoints-list">
        <div><span class="method">WS</span> ws://localhost:4000/kds (KDS WebSocket Gateway)</div>
        <div><span class="method">POST</span> /api/v1/health-profile/calculate (Kalkulator TDEE)</div>
        <div><span class="method">GET</span> /api/v1/kds/tickets (Daftar tiket dapur aktif)</div>
        <div><span class="method">PATCH</span> /api/v1/kds/tickets/:id/status (Pembaruan status koki via drag and drop)</div>
        <div><span class="method">GET</span> /api/v1/recipes/verify/:qrCode (Verifikasi sertifikasi lab)</div>
        <div><span class="method">POST</span> /api/v1/payments/midtrans-webhook (Webhook transaksi idempoten)</div>
      </div>
    </div>
  </main>
</body>
</html>`;
}
