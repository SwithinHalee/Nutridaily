export function renderKdsView(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Layar Dapur Sentral (KDS). NutriDaily Indonesia (Internal)</title>
  <link rel="icon" type="image/svg+xml" href="/brand/logo-light.svg">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-kds: #0C120F;
      --card-bg: #121916;
      --ticket-bg: #0F1512;
      --border-dark: #223129;
      --border-accent: #33493E;
      --text-main: #FDFBF7;
      --text-muted: #8FA39A;
      --forest: #2C4A3E;
      --forest-hover: #233B31;
      --forest-active: #1B2F27;
      --forest-border: #3D6656;
      --forest-subtle: #1E2B25;
      --terracotta: #D96B43;
      --terracotta-bg: rgba(217, 107, 67, 0.18);
      --font-body: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-display: 'Fraunces', Georgia, serif;
    }
    html, body {
      height: 100dvh;
      max-height: 100dvh;
      overflow: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
      background-color: var(--bg-kds);
      color: var(--text-main);
      font-family: var(--font-body);
      -webkit-font-smoothing: antialiased;
      position: relative;
    }
    html::-webkit-scrollbar,
    body::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    /* SVG feTurbulence film grain texture overlay (Zero gradients) */
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.16;
      mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      z-index: 99;
    }
    h1, h2, h3 { text-wrap: balance; font-weight: 600; letter-spacing: -0.015em; }
    p { text-wrap: pretty; }
    em, i { font-style: normal; font-weight: 500; }

    /* Compact Header Bar */
    header {
      background-color: var(--card-bg);
      border-bottom: 1px solid var(--border-dark);
      padding: 6px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
      height: 46px;
      z-index: 40;
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
      color: #FDFBF7;
      white-space: nowrap;
    }
    .status-badge {
      font-size: 10px;
      font-family: monospace;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(44, 74, 62, 0.45);
      border: 1px solid var(--forest-border);
      color: #D3DFD9;
      white-space: nowrap;
      font-weight: 700;
    }
    .subtext {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.2;
    }

    /* Live Instant Search Input */
    .header-search {
      flex: 1;
      max-width: 320px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 9px;
      color: var(--text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      background: var(--bg-kds);
      border: 1px solid var(--border-dark);
      border-radius: 6px;
      color: var(--text-main);
      font-size: 11px;
      font-family: inherit;
      padding: 5px 10px 5px 28px;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-input:focus {
      border-color: var(--forest-border);
    }
    .search-input::placeholder {
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .kds-btn {
      background: var(--bg-kds);
      border: 1px solid var(--border-dark);
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
    .kds-btn:hover {
      background: #18211C;
      border-color: var(--border-accent);
    }
    .kds-btn.active {
      border-color: var(--forest-border);
      color: #92B9A6;
      background: var(--forest-subtle);
    }

    /* Compact Sub-filter Bar */
    .sub-filter-bar {
      background: #0F1512;
      border-bottom: 1px solid var(--border-dark);
      padding: 4px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
      height: 36px;
    }
    .filter-group-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
      overflow-x: auto;
    }
    .filter-section {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .filter-label {
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .pill-group {
      display: flex;
      background: var(--bg-kds);
      padding: 2px;
      border-radius: 5px;
      border: 1px solid var(--border-dark);
    }
    .filter-pill {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 600;
      font-family: inherit;
      border-radius: 3px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s;
    }
    .filter-pill.active {
      background: var(--forest);
      color: #FDFBF7;
    }
    .summary-metrics {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10.5px;
      color: var(--text-muted);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .metric-chip {
      color: #D3DFD9;
      font-weight: 600;
    }

    /* Kanban Board Layout: Exactly 3 Zones (Antrean masak, Sedang dimasak, Diambil kurir) */
    .kanban-board {
      flex: 1;
      padding: 8px 14px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      overflow-x: auto;
      overflow-y: hidden;
      height: calc(100dvh - 82px);
    }
    @media (max-width: 900px) {
      .kanban-board {
        grid-template-columns: repeat(3, 300px);
      }
    }
    .kanban-col {
      background: var(--card-bg);
      border: 1px solid var(--border-dark);
      border-radius: 8px;
      padding: 8px 8px;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-width: 0;
      transition: border-color 0.15s, background-color 0.15s;
    }
    .kanban-col.drag-over {
      border: 2px dashed var(--forest);
      background-color: #14201A;
    }

    .col-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 6px;
      margin-bottom: 6px;
      border-bottom: 1px solid var(--border-dark);
      flex-shrink: 0;
    }
    .col-title {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .col-header-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .col-count {
      background: var(--bg-kds);
      border: 1px solid var(--border-dark);
      color: #D3DFD9;
      font-size: 10.5px;
      font-family: monospace;
      padding: 1px 6px;
      border-radius: 3px;
      font-weight: 700;
    }
    .col-clean-btn {
      background: rgba(44, 74, 62, 0.35);
      border: 1px solid var(--forest-border);
      color: #A3C9B8;
      padding: 2px 7px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s;
    }
    .col-clean-btn:hover {
      background: var(--forest);
      color: #FDFBF7;
    }
    .col-jump-btn {
      background: var(--bg-kds);
      border: 1px solid var(--border-dark);
      color: var(--text-muted);
      width: 18px;
      height: 18px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s, border-color 0.15s;
    }
    .col-jump-btn:hover {
      color: #FDFBF7;
      border-color: var(--border-accent);
    }

    /* Scrollable Tickets Container */
    .col-tickets {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 7px;
      overflow-y: auto;
      padding-right: 2px;
      scroll-behavior: smooth;
    }
    /* Minimalist Kitchen Scrollbar */
    .col-tickets::-webkit-scrollbar {
      width: 4px;
    }
    .col-tickets::-webkit-scrollbar-track {
      background: transparent;
    }
    .col-tickets::-webkit-scrollbar-thumb {
      background: #223129;
      border-radius: 2px;
    }
    .col-tickets::-webkit-scrollbar-thumb:hover {
      background: #33493E;
    }

    /* Clean Card (Stripped of images for maximum visibility and multi-tasking) */
    .ticket-card {
      background: var(--ticket-bg);
      border: 1px solid var(--border-dark);
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.3);
      position: relative;
      cursor: grab;
      user-select: none;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      transition: opacity 0.15s, border-color 0.15s, background-color 0.15s;
    }
    .ticket-card:active {
      cursor: grabbing;
    }
    /* Fixed Grounded Hover: card never enlarges or lifts */
    .ticket-card:hover {
      border-color: var(--border-accent);
      transform: none !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .ticket-card.is-dragging {
      opacity: 0.45;
      border-color: var(--forest);
    }
    .ticket-card.companion-highlight {
      border-color: var(--terracotta);
      background-color: rgba(217, 107, 67, 0.14);
      box-shadow: 0 0 0 1px var(--terracotta);
    }

    /* Ticket Header Row */
    .ticket-row-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      flex-shrink: 0;
    }
    .ticket-meta-left {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .ticket-number {
      font-family: monospace;
      font-size: 10.5px;
      font-weight: 700;
      color: #B9C6BE;
      white-space: nowrap;
    }
    .elapsed-time {
      font-size: 9.5px;
      font-family: monospace;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .delivery-tag {
      font-size: 9.5px;
      font-family: monospace;
      padding: 1px 5px;
      border-radius: 3px;
      background: #16201B;
      border: 1px solid var(--border-dark);
      color: #CBD5CE;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Text details */
    .customer-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #FDFBF7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.25;
      margin-top: 1px;
    }
    .recipe-title {
      font-size: 11px;
      font-weight: 500;
      color: #E2DDD5;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }
    .recipe-package {
      font-size: 9.5px;
      font-family: monospace;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Multi-Meal Order Badge */
    .multi-meal-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--terracotta-bg);
      border: 1px solid var(--terracotta);
      color: #F8B49B;
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 9px;
      font-weight: 600;
      width: fit-content;
      margin-top: 2px;
    }

    /* Multi-meal packaging alert for courier */
    .pack-alert-pill {
      font-size: 9px;
      font-weight: 600;
      padding: 3px 6px;
      border-radius: 3px;
      background: rgba(217, 107, 67, 0.16);
      border: 1px dashed var(--terracotta);
      color: #F8B49B;
      line-height: 1.3;
      margin-top: 2px;
    }
    .pack-complete-pill {
      font-size: 9px;
      font-weight: 600;
      padding: 3px 6px;
      border-radius: 3px;
      background: var(--forest-subtle);
      border: 1px solid var(--forest-border);
      color: #92B9A6;
      line-height: 1.3;
      margin-top: 2px;
    }

    /* Dispatched Card Row (Auto-Archiving Grace Period) */
    .dispatched-bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding-top: 4px;
      margin-top: 2px;
      border-top: 1px solid rgba(34, 49, 41, 0.7);
      font-size: 9.5px;
      color: var(--text-muted);
    }
    .archive-countdown {
      color: #92B9A6;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .single-archive-btn {
      background: transparent;
      border: 1px solid var(--border-dark);
      color: var(--text-muted);
      font-size: 9px;
      font-family: inherit;
      padding: 1px 5px;
      border-radius: 3px;
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
    }
    .single-archive-btn:hover {
      color: #FDFBF7;
      border-color: var(--forest-border);
    }

    /* Density Mode: Kisi 2 Kolom per Zone */
    /* Cards are guaranteed to fit without overlapping, clipping, or being covered */
    .density-grid .col-tickets {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
      align-content: start;
    }
    .density-grid .ticket-card {
      padding: 6px 7px;
      gap: 3px;
      min-width: 0;
      width: 100%;
      overflow: hidden;
    }
    .density-grid .customer-name {
      font-size: 11.5px;
    }
    .density-grid .recipe-title {
      font-size: 10px;
      -webkit-line-clamp: 2;
    }

    .empty-col {
      text-align: center;
      padding: 40px 12px;
      color: #6E645A;
      font-size: 11.5px;
      font-weight: 500;
    }

    /* Archive Drawer / Modal */
    .archive-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 10, 8, 0.78);
      backdrop-filter: blur(2px);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .archive-modal-backdrop.open {
      display: flex;
    }
    .archive-modal-box {
      background: var(--card-bg);
      border: 1px solid var(--border-dark);
      border-radius: 10px;
      width: 100%;
      max-width: 680px;
      max-height: 82vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 30px rgba(0,0,0,0.6);
      overflow: hidden;
    }
    .modal-header {
      padding: 12px 18px;
      border-bottom: 1px solid var(--border-dark);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .modal-title {
      font-size: 14px;
      font-weight: 700;
      color: #FDFBF7;
      font-family: var(--font-display);
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s;
    }
    .modal-close-btn:hover {
      color: #FDFBF7;
    }
    .modal-body {
      padding: 14px 18px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .archive-item-row {
      background: var(--ticket-bg);
      border: 1px solid var(--border-dark);
      border-radius: 6px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 11px;
    }
    .archive-item-text {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .archive-customer {
      font-weight: 700;
      color: #FDFBF7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .archive-recipe {
      color: var(--text-muted);
      font-size: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .archive-restore-btn {
      background: transparent;
      border: 1px solid var(--border-dark);
      color: #A3C9B8;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    .archive-restore-btn:hover {
      background: var(--forest);
      color: #FDFBF7;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-left">
      <div class="brand-badge-logo" title="NutriDaily Indonesia (Dapur Sentral)">
        <svg viewBox="0 0 100 100" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NutriDaily KDS">
          <circle cx="50" cy="50" r="43" stroke="#FDFBF7" stroke-width="4.5" />
          <path d="M22 53 C 22 71, 34 81, 50 81 C 66 81, 78 71, 78 53 Z" fill="#FDFBF7" />
          <path d="M50 47 C 43 37, 37 25, 50 15 C 58 25, 54 37, 50 47 Z" fill="#EDE8DE" />
          <path d="M52 47 C 58 39, 68 31, 66 17 C 54 21, 52 37, 52 47 Z" fill="#D96B43" />
        </svg>
      </div>
      <div class="title-row">
        <h1>NutriDaily</h1>
        <span class="status-badge" id="ws-indicator">KDS</span>
      </div>
    </div>

    <!-- Live Quick Search for Fast Multi-Tasking Order Finding -->
    <div class="header-search">
      <svg class="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <input
        type="text"
        class="search-input"
        id="kds-search-input"
        placeholder="Cari tiket..."
        oninput="handleSearch(this.value)"
        autocomplete="off"
        spellcheck="false"
      />
    </div>

    <div class="header-actions">
      <!-- Archive Drawer / History Toggle Button -->
      <button
        class="kds-btn"
        id="archive-btn"
        type="button"
        onclick="toggleArchiveModal(true)"
        title="Lihat riwayat pesanan yang telah diarsipkan hari ini"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
        <span>Arsip (<span id="archive-count-badge">0</span>)</span>
      </button>

      <!-- Density Mode Switcher (1 Kolom vs Kisi 2 Kolom) -->
      <button
        class="kds-btn"
        id="density-btn"
        type="button"
        onclick="toggleGridDensity()"
        title="Ubah tata letak antara baris 1 kolom dan kisi 2 kolom"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="18"></rect><rect x="14" y="3" width="7" height="18"></rect></svg>
        <span id="density-btn-text">1 kolom</span>
      </button>

      <!-- Kitchen Audio Alert Toggle -->
      <button class="kds-btn active" id="audio-toggle" type="button" aria-pressed="true" onclick="toggleAudio()">
        Suara: Aktif
      </button>

      <!-- Standard Uniform Navigation Links -->
      <a href="/" class="kds-btn" title="Beranda portal internal">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>Beranda</span>
      </a>
      <a href="/kds" class="kds-btn active" title="Layar dapur sentral (KDS)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="18"></rect><rect x="14" y="3" width="7" height="18"></rect></svg>
        <span>Dapur</span>
      </a>
      <a href="/admin" class="kds-btn" title="Portal admin & tele-gizi">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span>Admin</span>
      </a>
      <a href="http://localhost:3000" target="_blank" class="kds-btn" title="Web pelanggan (Port 3000)">
        <span>Web</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </a>
    </div>
  </header>

  <!-- Sub-filter bar (Batch Delivery Slot & Station Filter & Summary Metrics) -->
  <div class="sub-filter-bar">
    <div class="filter-group-wrap">
      <!-- Contingency 1: Batch Delivery Slot Filter -->
      <div class="filter-section">
        <span class="filter-label">Slot:</span>
        <div class="pill-group" role="group" aria-label="Filter slot pengantaran">
          <button class="filter-pill active" onclick="setSlotFilter('ALL', this)">Semua</button>
          <button class="filter-pill" onclick="setSlotFilter('Slot 11.00 - 12.00', this)">11.00</button>
          <button class="filter-pill" onclick="setSlotFilter('Slot 12.00 - 13.00', this)">12.00</button>
        </div>
      </div>

      <!-- Station Filter -->
      <div class="filter-section">
        <span class="filter-label">Stasiun:</span>
        <div class="pill-group" role="group" aria-label="Filter stasiun dapur">
          <button class="filter-pill active" onclick="setStation('ALL', this)">Semua</button>
          <button class="filter-pill" onclick="setStation('PROTEIN', this)">Protein</button>
          <button class="filter-pill" onclick="setStation('CARB', this)">Karbo</button>
          <button class="filter-pill" onclick="setStation('PACKING', this)">Kemas</button>
        </div>
      </div>
    </div>

    <!-- Real-time Metrics Summary -->
    <div class="summary-metrics">
      <span id="orders-visible-counter">Memuat tiket...</span>
      <span style="color: var(--border-accent);">|</span>
      <span>Geser kartu antar 3 zone untuk ubah status</span>
    </div>
  </div>

  <!-- Main Kanban Board: 3 Zones Only -->
  <main class="kanban-board" id="kanban-main-board">
    <!-- Zone 1: Antrean masak (QUEUED) -->
    <div
      class="kanban-col"
      id="kanban-col-QUEUED"
      ondragover="handleDragOver(event)"
      ondragenter="handleDragEnter(event, 'QUEUED')"
      ondragleave="handleDragLeave(event, 'QUEUED')"
      ondrop="handleDrop(event, 'QUEUED')"
    >
      <div class="col-header">
        <span class="col-title">1. Antrean masak</span>
        <div class="col-header-right">
          <span class="col-count" id="count-QUEUED">0</span>
          <button class="col-jump-btn" onclick="scrollCol('col-QUEUED', 'up')" title="Gulir ke atas" aria-label="Gulir kolom ke atas">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </button>
          <button class="col-jump-btn" onclick="scrollCol('col-QUEUED', 'down')" title="Gulir ke bawah" aria-label="Gulir kolom ke bawah">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
      </div>
      <div class="col-tickets" id="col-QUEUED"></div>
    </div>

    <!-- Zone 2: Sedang dimasak (COOKING) -->
    <div
      class="kanban-col"
      id="kanban-col-COOKING"
      ondragover="handleDragOver(event)"
      ondragenter="handleDragEnter(event, 'COOKING')"
      ondragleave="handleDragLeave(event, 'COOKING')"
      ondrop="handleDrop(event, 'COOKING')"
    >
      <div class="col-header">
        <span class="col-title">2. Sedang dimasak</span>
        <div class="col-header-right">
          <span class="col-count" id="count-COOKING">0</span>
          <button class="col-jump-btn" onclick="scrollCol('col-COOKING', 'up')" title="Gulir ke atas" aria-label="Gulir kolom ke atas">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </button>
          <button class="col-jump-btn" onclick="scrollCol('col-COOKING', 'down')" title="Gulir ke bawah" aria-label="Gulir kolom ke bawah">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
      </div>
      <div class="col-tickets" id="col-COOKING"></div>
    </div>

    <!-- Zone 3: Diambil kurir (DISPATCHED) -->
    <div
      class="kanban-col"
      id="kanban-col-DISPATCHED"
      ondragover="handleDragOver(event)"
      ondragenter="handleDragEnter(event, 'DISPATCHED')"
      ondragleave="handleDragLeave(event, 'DISPATCHED')"
      ondrop="handleDrop(event, 'DISPATCHED')"
    >
      <div class="col-header">
        <span class="col-title">3. Diambil kurir</span>
        <div class="col-header-right">
          <span class="col-count" id="count-DISPATCHED">0</span>
          <!-- Manual Clear Button for Dispatched Orders -->
          <button class="col-clean-btn" onclick="archiveAllDispatched()" title="Bersihkan seluruh pesanan yang sudah diambil kurir">
            Bersihkan selesai
          </button>
          <button class="col-jump-btn" onclick="scrollCol('col-DISPATCHED', 'up')" title="Gulir ke atas" aria-label="Gulir kolom ke atas">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </button>
          <button class="col-jump-btn" onclick="scrollCol('col-DISPATCHED', 'down')" title="Gulir ke bawah" aria-label="Gulir kolom ke bawah">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
      </div>
      <div class="col-tickets" id="col-DISPATCHED"></div>
    </div>
  </main>

  <!-- Archive History Modal Dialog -->
  <div class="archive-modal-backdrop" id="archive-modal" onclick="handleModalBackdropClick(event)">
    <div class="archive-modal-box">
      <div class="modal-header">
        <div>
          <h2 class="modal-title">Riwayat pesanan terkirim & diarsipkan</h2>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            Daftar pesanan yang telah diserahkan ke kurir dan diarsipkan secara otomatis (5 menit) atau manual.
          </p>
        </div>
        <button type="button" class="modal-close-btn" onclick="toggleArchiveModal(false)" title="Tutup riwayat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="modal-body" id="archive-modal-body">
        <!-- Rendered dynamically -->
      </div>
    </div>
  </div>

  <script>
    let tickets = [];
    let currentStationFilter = 'ALL';
    let currentSlotFilter = 'ALL';
    let searchQuery = '';
    let isGridDensity = false;
    let audioEnabled = true;
    let draggedTicketId = null;

    // 5-minute auto-archival grace period (in ms)
    const AUTO_ARCHIVE_MS = 5 * 60 * 1000;

    // Time elapsed formatter (e.g., '12m')
    function getElapsedMinutes(isoString) {
      if (!isoString) return '';
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.max(1, Math.floor(diffMs / 60000));
      return mins + 'm';
    }

    // Pure Web Audio synthesizer chime
    function playChime(freq = 587.33) {
      if (!audioEnabled) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (e) {
        console.warn('Audio chime:', e);
      }
    }

    function toggleAudio() {
      audioEnabled = !audioEnabled;
      const btn = document.getElementById('audio-toggle');
      btn.setAttribute('aria-pressed', audioEnabled ? 'true' : 'false');
      btn.classList.toggle('active', audioEnabled);
      btn.textContent = audioEnabled ? 'Suara: Aktif' : 'Suara: Senyap';
    }

    // Density mode toggle: Standar (1 Kolom) vs Kisi (2 Kolom)
    function toggleGridDensity() {
      isGridDensity = !isGridDensity;
      const board = document.getElementById('kanban-main-board');
      const btn = document.getElementById('density-btn');
      const text = document.getElementById('density-btn-text');

      board.classList.toggle('density-grid', isGridDensity);
      btn.classList.toggle('active', isGridDensity);
      text.textContent = isGridDensity ? '2 kolom' : '1 kolom';
    }

    // Column fast scroll up/down
    function scrollCol(colId, direction) {
      const colEl = document.getElementById(colId);
      if (!colEl) return;
      if (direction === 'up') {
        colEl.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        colEl.scrollTo({ top: colEl.scrollHeight, behavior: 'smooth' });
      }
    }

    // Instant search filter handler
    function handleSearch(query) {
      searchQuery = (query || '').toLowerCase().trim();
      renderBoard();
    }

    function setStation(station, el) {
      currentStationFilter = station;
      el.parentElement.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderBoard();
    }

    function setSlotFilter(slot, el) {
      currentSlotFilter = slot;
      el.parentElement.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderBoard();
    }

    async function loadTickets() {
      try {
        const res = await fetch('/api/v1/kds/tickets');
        if (res.ok) {
          const json = await res.json();
          tickets = json.data || [];
          checkAutoArchival();
          renderBoard();
        }
      } catch (err) {
        console.error('Gagal mengambil tiket KDS:', err);
      }
    }

    // Check and apply 5-minute auto-archival for dispatched tickets
    function checkAutoArchival() {
      const now = Date.now();
      let hasChanges = false;

      tickets.forEach(t => {
        if (t.status === 'DISPATCHED' && !t.isArchived && t.dispatchedAt) {
          const elapsed = now - new Date(t.dispatchedAt).getTime();
          if (elapsed >= AUTO_ARCHIVE_MS) {
            t.isArchived = true;
            t.archivedAt = new Date().toISOString();
            hasChanges = true;
            fetch('/api/v1/kds/tickets/' + t.id + '/archive', { method: 'POST' }).catch(() => {});
          }
        }
      });

      return hasChanges;
    }

    // Manual archive single ticket
    async function archiveSingleTicket(id) {
      const t = tickets.find(item => item.id === id);
      if (!t) return;
      t.isArchived = true;
      t.archivedAt = new Date().toISOString();
      playChime(523.25);
      renderBoard();

      try {
        await fetch('/api/v1/kds/tickets/' + id + '/archive', { method: 'POST' });
      } catch (err) {
        console.error('Gagal mengarsipkan tiket:', err);
      }
    }

    // Manual archive all currently active dispatched orders
    async function archiveAllDispatched() {
      const dispatchedActive = tickets.filter(t => t.status === 'DISPATCHED' && !t.isArchived);
      if (dispatchedActive.length === 0) return;

      const nowIso = new Date().toISOString();
      tickets = tickets.map(t => {
        if (t.status === 'DISPATCHED' && !t.isArchived) {
          return { ...t, isArchived: true, archivedAt: nowIso };
        }
        return t;
      });

      playChime(659.25);
      renderBoard();

      try {
        await fetch('/api/v1/kds/tickets/archive-dispatched', { method: 'POST' });
      } catch (err) {
        console.error('Gagal mengarsipkan seluruh pesanan selesai:', err);
      }
    }

    // Restore archived ticket back to active queue
    async function restoreTicket(id) {
      const t = tickets.find(item => item.id === id);
      if (!t) return;
      t.isArchived = false;
      delete t.archivedAt;
      playChime(440);
      renderBoard();
      renderArchiveModalBody();

      try {
        await fetch('/api/v1/kds/tickets/' + id + '/restore', { method: 'POST' });
      } catch (err) {
        console.error('Gagal mengembalikan tiket dari arsip:', err);
      }
    }

    // Modal Drawer Control
    function toggleArchiveModal(open) {
      const modal = document.getElementById('archive-modal');
      if (open) {
        renderArchiveModalBody();
        modal.classList.add('open');
      } else {
        modal.classList.remove('open');
      }
    }

    function handleModalBackdropClick(e) {
      if (e.target.id === 'archive-modal') {
        toggleArchiveModal(false);
      }
    }

    function renderArchiveModalBody() {
      const bodyEl = document.getElementById('archive-modal-body');
      const archived = tickets.filter(t => t.isArchived);

      if (archived.length === 0) {
        bodyEl.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 12px;">Belum ada pesanan yang diarsipkan hari ini</div>';
        return;
      }

      bodyEl.innerHTML = archived.map(t => {
        const timeStr = t.dispatchedAt ? new Date(t.dispatchedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini';

        return \`
          <div class="archive-item-row">
            <div class="archive-item-text">
              <div class="archive-customer">\${t.customerName} (\${t.ticketNumber})</div>
              <div class="archive-recipe">\${t.recipeTitle}</div>
              <div style="font-size: 9.5px; color: var(--forest); font-family: monospace;">Diserahkan kurir: \${timeStr}</div>
            </div>
            <button type="button" class="archive-restore-btn" onclick="restoreTicket('\${t.id}')" title="Kembalikan tiket ini ke kolom diambil kurir">
              Kembalikan ke antrean
            </button>
          </div>
        \`;
      }).join('');
    }

    // Multi-meal companion box linked highlight
    function highlightCompanionBoxes(groupId) {
      if (!groupId) return;
      document.querySelectorAll('[data-group-id="' + groupId + '"]').forEach(el => {
        el.classList.add('companion-highlight');
      });
    }

    function unhighlightCompanionBoxes(groupId) {
      if (!groupId) return;
      document.querySelectorAll('[data-group-id="' + groupId + '"]').forEach(el => {
        el.classList.remove('companion-highlight');
      });
    }

    // Drag and Drop Logic
    function handleDragStart(e, id) {
      draggedTicketId = id;
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
      const card = document.getElementById('ticket-' + id);
      if (card) {
        setTimeout(() => card.classList.add('is-dragging'), 0);
      }
    }

    function handleDragEnd(e) {
      draggedTicketId = null;
      document.querySelectorAll('.ticket-card').forEach(c => c.classList.remove('is-dragging'));
      document.querySelectorAll('.kanban-col').forEach(col => col.classList.remove('drag-over'));
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e, zoneKey) {
      e.preventDefault();
      const col = document.getElementById('kanban-col-' + zoneKey);
      if (col) col.classList.add('drag-over');
    }

    function handleDragLeave(e, zoneKey) {
      const col = document.getElementById('kanban-col-' + zoneKey);
      if (col && !col.contains(e.relatedTarget)) {
        col.classList.remove('drag-over');
      }
    }

    async function handleDrop(e, targetZoneKey) {
      e.preventDefault();
      const col = document.getElementById('kanban-col-' + targetZoneKey);
      if (col) col.classList.remove('drag-over');

      const id = e.dataTransfer.getData('text/plain') || draggedTicketId;
      if (!id) return;

      const currentTicket = tickets.find(t => t.id === id);
      if (!currentTicket) return;

      // Map zone target to status
      let targetStatus = targetZoneKey; // 'QUEUED', 'COOKING', or 'DISPATCHED'
      if (currentTicket.status === targetStatus) return;

      playChime(659.25); // Chime notification on drop

      // Multi-meal group check: hold Shift while dropping to move entire customer order
      const isMultiMeal = currentTicket.totalMealsInOrder && currentTicket.totalMealsInOrder > 1;
      let shouldMoveWholeGroup = false;

      if (isMultiMeal && currentTicket.orderGroupId) {
        const companionCount = tickets.filter(t => t.orderGroupId === currentTicket.orderGroupId && t.id !== id).length;
        if (companionCount > 0 && e.shiftKey) {
          shouldMoveWholeGroup = true;
        }
      }

      // Optimistic state update
      const nowIso = new Date().toISOString();
      if (shouldMoveWholeGroup) {
        tickets = tickets.map(t => {
          if (t.orderGroupId === currentTicket.orderGroupId) {
            const updatedItem = { ...t, status: targetStatus };
            if (targetStatus === 'DISPATCHED') {
              updatedItem.dispatchedAt = nowIso;
              updatedItem.isArchived = false;
            }
            return updatedItem;
          }
          return t;
        });
      } else {
        tickets = tickets.map(t => {
          if (t.id === id) {
            const updatedItem = { ...t, status: targetStatus };
            if (targetStatus === 'DISPATCHED') {
              updatedItem.dispatchedAt = nowIso;
              updatedItem.isArchived = false;
            }
            return updatedItem;
          }
          return t;
        });
      }
      renderBoard();

      try {
        const res = await fetch('/api/v1/kds/tickets/' + id + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus })
        });
        if (res.ok) {
          const updated = await res.json();
          tickets = tickets.map(t => t.id === id ? updated.data : t);
          renderBoard();
        }
      } catch (err) {
        console.error('Gagal memperbarui status via drag and drop:', err);
      }
    }

    function renderBoard() {
      // Exactly 3 Zones
      const zones = [
        { key: 'QUEUED', statuses: ['QUEUED'] },
        { key: 'COOKING', statuses: ['COOKING', 'PLATED', 'PACKED'] },
        { key: 'DISPATCHED', statuses: ['DISPATCHED'] }
      ];
      const now = Date.now();

      // Update archive count badge
      const archivedCount = tickets.filter(t => t.isArchived).length;
      const archiveBadge = document.getElementById('archive-count-badge');
      if (archiveBadge) archiveBadge.textContent = archivedCount;

      // Filter out archived tickets for the active board
      let activeTickets = tickets.filter(t => !t.isArchived);

      // 1. Filter by delivery slot
      let filtered = activeTickets;
      if (currentSlotFilter !== 'ALL') {
        filtered = filtered.filter(t => (t.deliverySlot || '').includes(currentSlotFilter) || t.deliverySlot === currentSlotFilter);
      }

      // 2. Filter by search query (instant multi-tasking lookup)
      if (searchQuery) {
        filtered = filtered.filter(t => {
          const name = (t.customerName || '').toLowerCase();
          const num = (t.ticketNumber || '').toLowerCase();
          const rec = (t.recipeTitle || '').toLowerCase();
          return name.includes(searchQuery) || num.includes(searchQuery) || rec.includes(searchQuery);
        });
      }

      // Update counter metric
      const counterEl = document.getElementById('orders-visible-counter');
      if (counterEl) {
        counterEl.innerHTML = \`<span class="metric-chip">\${filtered.length}</span> dari \${activeTickets.length} aktif\`;
      }

      zones.forEach(zone => {
        const colEl = document.getElementById('col-' + zone.key);
        const countEl = document.getElementById('count-' + zone.key);
        const colTickets = filtered.filter(t => zone.statuses.includes(t.status));
        countEl.textContent = colTickets.length;

        if (colTickets.length === 0) {
          colEl.innerHTML = '<div class="empty-col">Tidak ada pesanan aktif</div>';
          return;
        }

        colEl.innerHTML = colTickets.map(t => {
          const isMultiMeal = t.totalMealsInOrder && t.totalMealsInOrder > 1;
          const groupId = t.orderGroupId || '';
          const elapsed = getElapsedMinutes(t.queuedAt);

          // Courier packaging protection pill for Zone 3 (DISPATCHED)
          let packagingPill = '';
          if (isMultiMeal && t.status === 'DISPATCHED') {
            const allInGroup = tickets.filter(item => item.orderGroupId === groupId);
            const allPacked = allInGroup.every(item => item.status === 'DISPATCHED');
            if (allPacked) {
              packagingPill = \`
                <div class="pack-complete-pill">
                  Paket lengkap (\${t.totalMealsInOrder}/\${t.totalMealsInOrder} boks): Siap kirim
                </div>
              \`;
            } else {
              packagingPill = \`
                <div class="pack-alert-pill">
                  Perhatian kurir: Tunggu boks lainnya (\${t.totalMealsInOrder} boks)
                </div>
              \`;
            }
          }

          // Dispatched Auto-Archiving Countdown & Quick Dismiss Bar
          let dispatchedBar = '';
          if (t.status === 'DISPATCHED') {
            const elapsedSinceDispatch = t.dispatchedAt ? now - new Date(t.dispatchedAt).getTime() : 0;
            const remainingMs = Math.max(0, AUTO_ARCHIVE_MS - elapsedSinceDispatch);
            const remainingMins = Math.max(1, Math.ceil(remainingMs / 60000));

            dispatchedBar = \`
              <div class="dispatched-bottom-bar">
                <span class="archive-countdown">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>Arsip dalam \${remainingMins}m</span>
                </span>
                <button type="button" class="single-archive-btn" onclick="archiveSingleTicket('\${t.id}')" title="Arsipkan tiket ini sekarang">
                  Arsipkan
                </button>
              </div>
            \`;
          }

          // Clean card without images (ultra-compact, high text legibility, zero clipping)
          return \`
            <div
              class="ticket-card"
              id="ticket-\${t.id}"
              data-group-id="\${groupId}"
              draggable="true"
              ondragstart="handleDragStart(event, '\${t.id}')"
              ondragend="handleDragEnd(event)"
              onmouseenter="highlightCompanionBoxes('\${groupId}')"
              onmouseleave="unhighlightCompanionBoxes('\${groupId}')"
            >
              <div class="ticket-row-top">
                <div class="ticket-meta-left">
                  <span class="ticket-number">\${t.ticketNumber}</span>
                  \${elapsed ? \`<span class="elapsed-time">\${elapsed}</span>\` : ''}
                </div>
                <span class="delivery-tag">\${(t.deliverySlot || '11.00').replace('Slot ', '')}</span>
              </div>

              <div class="customer-name" title="\${t.customerName}">\${t.customerName}</div>
              <div class="recipe-title" title="\${t.recipeTitle}">\${t.recipeTitle}</div>
              <div class="recipe-package">\${t.packageType || 'NutriDaily Menu'}</div>

              \${isMultiMeal ? \`
                <div class="multi-meal-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  <span>Paket \${t.totalMealsInOrder} boks • Boks \${t.mealIndex || 1}/\${t.totalMealsInOrder}</span>
                </div>
              \` : ''}

              \${packagingPill}
              \${dispatchedBar}
            </div>
          \`;
        }).join('');
      });
    }

    // Initial load
    loadTickets();

    // 5s interval polling for sync with server
    setInterval(loadTickets, 5000);

    // 30s local interval for countdown tick & auto-archive verification
    setInterval(() => {
      const changed = checkAutoArchival();
      if (changed) renderBoard();
    }, 30000);
  </script>
</body>
</html>`;
}
