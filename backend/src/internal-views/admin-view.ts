export function renderAdminView(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Admin & Tele-Nutritionist. NutriDaily Indonesia (Internal)</title>
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
      --border-accent: #C8BEAF;
      --text-main: #1A1310;
      --text-muted: #6E665E;
      --forest: #2C4A3E;
      --forest-hover: #233B31;
      --forest-active: #1B2F27;
      --forest-subtle: #EBF0EE;
      --terracotta: #D96B43;
      --terracotta-subtle: #FBF0EB;
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
    /* Film grain texture overlay (Flat color, zero gradients) */
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

    /* Admin Layout: 2-Column Sidebar + Content Area */
    .admin-wrapper {
      display: flex;
      flex: 1;
      width: 100%;
      min-height: calc(100dvh - 46px);
      background-color: var(--bg-base);
    }

    .admin-sidebar {
      width: 250px;
      min-width: 250px;
      max-width: 250px;
      background-color: var(--surface);
      border-right: 1px solid var(--border-warm);
      display: flex;
      flex-direction: column;
      padding: 16px 0;
      position: sticky;
      top: 46px;
      height: calc(100dvh - 46px);
      overflow-y: auto;
      flex-shrink: 0;
      gap: 0;
      border-bottom: none;
    }

    .sidebar-meta {
      padding: 0 16px 14px 16px;
      border-bottom: 1px solid var(--border-warm);
      margin-bottom: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sidebar-tag {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--terracotta);
    }

    .sidebar-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0;
      flex: 1;
      width: 100%;
    }

    .tab-bar .tab-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 16px;
      border-radius: 0;
      border: none;
      border-left: 3px solid transparent;
      background: transparent;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      text-align: left;
      width: 100%;
      box-sizing: border-box;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .tab-bar .tab-item svg {
      flex-shrink: 0;
      color: var(--text-muted);
      transition: color 0.15s;
    }

    .tab-bar .tab-item:hover {
      background: var(--surface-subtle);
      color: var(--text-main);
    }

    .tab-bar .tab-item:hover svg {
      color: var(--forest);
    }

    .tab-bar .tab-item:focus-visible {
      outline: 2px solid var(--forest);
      outline-offset: -2px;
    }

    .tab-bar .tab-item.active {
      background: var(--forest-subtle);
      border-left: 3px solid var(--forest);
      color: var(--forest);
      font-weight: 700;
      box-shadow: none;
    }

    .tab-bar .tab-item.active svg {
      color: var(--forest);
    }

    .sidebar-status-box {
      margin-top: auto;
      padding: 14px 16px;
      border-top: 1px solid var(--border-warm);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sidebar-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      flex-shrink: 0;
    }

    .sidebar-status-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .sidebar-status-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-main);
    }

    .sidebar-status-val {
      font-size: 10px;
      color: var(--text-muted);
      font-family: monospace;
    }

    .admin-main {
      flex: 1;
      min-width: 0;
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .admin-main.admin-main-flush,
    .admin-main:has(#tab-calendar.active) {
      padding: 0;
      gap: 0;
    }

    @media (max-width: 900px) {
      .admin-wrapper {
        flex-direction: column;
      }
      .admin-sidebar {
        width: 100%;
        min-width: 100%;
        max-width: 100%;
        height: auto;
        position: static;
        border-right: none;
        border-bottom: 1px solid var(--border-warm);
        padding: 0;
      }
      .sidebar-meta {
        padding: 10px 16px;
      }
      .sidebar-nav {
        flex-direction: row;
        overflow-x: auto;
        gap: 0;
      }
      .tab-bar .tab-item {
        width: auto;
        padding: 10px 14px;
        border-left: none;
        border-bottom: 2px solid transparent;
      }
      .tab-bar .tab-item.active {
        border-left: none;
        border-bottom: 2px solid var(--forest);
      }
      .sidebar-status-box {
        display: none;
      }
      .admin-main {
        padding: 16px;
      }
      .admin-main.admin-main-flush,
      .admin-main:has(#tab-calendar.active) {
        padding: 0;
        gap: 0;
      }
    }

    /* Tab content areas */
    .tab-content { display: none; }
    #cal-msg:empty { display: none; }
    .tab-content.active { display: block; }
    #tab-calendar.active {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
    }

    /* Tables */
    .table-container {
      background: var(--surface);
      border: 1px solid var(--border-warm);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(26, 19, 16, 0.04);
    }
    .table-header-bar {
      padding: 14px 18px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid var(--border-warm);
      background: var(--surface-subtle);
    }
    .table-search {
      padding: 8px 12px;
      border: 1px solid var(--border-warm);
      border-radius: 6px;
      font-size: 12px;
      width: 260px;
      font-family: inherit;
      background: var(--surface);
      outline: none;
    }
    .table-search:focus {
      border-color: var(--forest);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }
    th {
      background: var(--surface-subtle);
      padding: 10px 14px;
      font-weight: 700;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--border-warm);
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-warm);
      color: var(--text-main);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #FAF7F0; }

    .tag {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      display: inline-block;
      letter-spacing: 0.03em;
    }
    .tag-champion { background: #FEF3C7; color: #92400E; }
    .tag-loyal { background: #DEF7EC; color: #03543F; }
    .tag-risk { background: #FDE8E8; color: #9B1C1C; }

    /* Recipe grid with visual food photography */
    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }
    .recipe-card {
      background: var(--surface);
      border: 1px solid var(--border-warm);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 2px rgba(26, 19, 16, 0.04);
    }
    .recipe-img-box {
      width: 100%;
      height: 150px;
      background-color: var(--surface-subtle);
      overflow: hidden;
      position: relative;
    }
    .recipe-img-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .recipe-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }
    .recipe-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .recipe-sku {
      font-family: monospace;
      font-size: 11px;
      color: var(--forest);
      font-weight: 700;
    }
    .lab-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--forest-subtle);
      color: var(--forest);
      border: 1px solid rgba(44, 74, 62, 0.2);
    }
    .recipe-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.35;
    }
    .macro-bar {
      display: flex;
      gap: 14px;
      font-size: 11px;
      font-weight: 600;
      padding-top: 10px;
      border-top: 1px solid var(--border-warm);
      margin-top: auto;
    }
    .macro-cal { font-weight: 700; color: var(--text-main); }
    .macro-p { color: #1E429F; }
    .macro-c { color: #B45309; }
    .macro-f { color: #B91C1C; }

    /* Food manager: bento asymmetric, snap scale, concentric radius */
    .eyebrow {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--forest);
    }
    .food-form-card {
      background: var(--surface);
      border: 1px solid var(--border-warm);
      border-radius: 12px;
      padding: 18px;
      box-shadow: 0 1px 2px rgba(26, 19, 16, 0.04);
    }
    .food-field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 14px;
    }
    .food-field-grid .field-wide { grid-column: 1 / -1; }
    @media (max-width: 640px) {
      .food-field-grid { grid-template-columns: 1fr; }
    }
    .field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text-main); }
    .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
    .input {
      padding: 8px 12px;
      border: 1px solid var(--border-warm);
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      background: var(--surface);
      color: var(--text-main);
      width: 100%;
      outline: none;
    }
    .input:hover { border-color: var(--border-accent); }
    .input:active { border-color: var(--forest); }
    .input:focus-visible { border-color: var(--forest); box-shadow: 0 0 0 2px rgba(44, 74, 62, 0.18); }
    .check-row { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; }
    .check-row input { width: 16px; height: 16px; accent-color: var(--forest); }
    .btn-primary {
      background: var(--forest);
      border: 1px solid var(--forest);
      color: #FDFBF7;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary:hover { background: var(--forest-hover); }
    .btn-primary:active { background: var(--forest-active); }
    .btn-primary:focus-visible { outline: 2px solid var(--forest); outline-offset: 2px; }
    .btn-primary:disabled { opacity: 0.6; cursor: wait; }
    .btn-ghost {
      background: var(--surface);
      border: 1px solid var(--border-warm);
      color: var(--text-main);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-ghost:hover { border-color: var(--forest); color: var(--forest); }
    .btn-ghost:active { background: var(--forest-subtle); }
    .btn-ghost:focus-visible { outline: 2px solid var(--forest); outline-offset: 2px; }
    .food-manager-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      align-items: stretch;
    }
    @media (max-width: 1000px) {
      .food-manager-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .food-manager-grid { grid-template-columns: minmax(0, 1fr); }
    }
    .fx-shell {
      display: flex;
      border: none;
      border-radius: 0;
      margin: 0;
      overflow: hidden;
      background: var(--surface);
      min-height: calc(100dvh - 46px);
      width: 100%;
      box-shadow: none;
      flex: 1;
    }
    @media (max-width: 900px) {
      .fx-shell { flex-direction: column; }
    }
    .fx-side {
      width: 275px;
      flex-shrink: 0;
      background: #241C18;
      color: #FDFBF7;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 0;
      overflow: hidden;
    }
    @media (max-width: 900px) {
      .fx-side { width: auto; }
    }
    .fx-month-row { display: flex; justify-content: space-between; align-items: center; gap: 4px; }
    .fx-month-title { font-size: 22px; font-weight: 500; display: flex; align-items: baseline; gap: 8px; }
    .fx-month-title .fx-year { color: #D96B43; font-weight: 400; }
    .fx-mini-nav { display: flex; gap: 4px; }
    .fx-icon-btn {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 8px;
      color: #FDFBF7;
      cursor: pointer;
      font-family: inherit;
    }
    .fx-icon-btn:hover { background: rgba(255, 255, 255, 0.2); }
    .fx-mini { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0; }
    .fx-mini-dow { font-size: 10px; font-weight: 700; color: #8C8276; text-align: center; padding: 4px 0; }
    .fx-mini-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 4px 0 5px;
      background: none;
      border: none;
      border-radius: 8px;
      color: #FDFBF7;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      min-height: 34px;
    }
    .fx-mini-day:hover { background: rgba(255, 255, 255, 0.08); }
    .fx-mini-day.is-dim { color: rgba(253, 251, 247, 0.35); }
    .fx-mini-day.is-weekend { color: rgba(253, 251, 247, 0.35); }
    .fx-mini-day.is-today { background: #2C4A3E; color: #FDFBF7; }
    .fx-mini-day.is-selected { box-shadow: inset 0 0 0 2px #D96B43; }
    .fx-mini-dots { display: flex; gap: 2px; height: 4px; }
    .fx-mini-dots i { width: 4px; height: 4px; border-radius: 50%; display: inline-block; }
    .fx-agenda { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex: 1; min-height: 0; padding-right: 2px; scrollbar-width: thin; scrollbar-color: #6E665E transparent; }
    .fx-agenda::-webkit-scrollbar { width: 5px; background: transparent; }
    .fx-agenda::-webkit-scrollbar-track { background: transparent; }
    .fx-agenda::-webkit-scrollbar-thumb { background: #6E665E; border-radius: 9999px; }
    .fx-agenda::-webkit-scrollbar-thumb:hover { background: #D96B43; }
    .fx-agenda-day { display: flex; flex-direction: column; gap: 6px; }
    .fx-agenda-head { display: flex; align-items: baseline; gap: 6px; font-size: 12px; }
    .fx-agenda-head strong { font-weight: 700; color: #F5C250; }
    .fx-agenda-head span { color: rgba(253, 251, 247, 0.6); }
    .fx-agenda-head.today strong, .fx-agenda-head.today span { color: #62C656; }
    .fx-agenda-item {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: #FDFBF7;
      font-family: inherit;
      font-size: 12px;
      text-align: left;
      cursor: pointer;
      padding: 2px 0 2px 20px;
      position: relative;
    }
    .fx-agenda-item:hover { text-decoration: underline; }
    .fx-agenda-item span {
      display: block;
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .fx-agenda-more { font-size: 11px; color: rgba(253, 251, 247, 0.6); padding-left: 20px; }
    .fx-agenda-item i { position: absolute; left: 0; width: 12px; height: 12px; border-radius: 50%; }
    .fx-side-foot { font-size: 11px; color: rgba(253, 251, 247, 0.6); margin: auto 0 0; }
    .fx-main { flex: 1; min-width: 0; min-height: 0; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: var(--surface); overflow-x: auto; }
    .fx-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .fx-arrows { display: flex; }
    .fx-nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #F4F0E8;
      border: none;
      color: #1A1310;
      font-family: inherit;
      font-size: 12px;
      cursor: pointer;
      padding: 6px 12px;
      min-height: 28px;
      min-width: 28px;
    }
    .fx-nav-btn:hover { background: #E5DFD5; }
    .fx-nav-side:first-child { border-radius: 6px 0 0 6px; }
    .fx-nav-side:last-child { border-radius: 0 6px 6px 0; }
    .fx-week-label { font-size: 13px; font-weight: 700; }
    .fx-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
    .fx-legend-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; color: #6E665E; white-space: nowrap; }
    .fx-legend-item i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex-shrink: 0; }
    .fx-search {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #F4F0E8;
      border-radius: 4px;
      padding: 4px 8px;
      color: #6E665E;
    }
    .fx-search input { border: none; background: transparent; outline: none; font-size: 12px; font-family: inherit; color: #1A1310; width: 148px; }
    .fx-search-pop {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      width: 280px;
      max-height: 320px;
      overflow-y: auto;
      background: var(--surface);
      border: 1px solid var(--border-warm);
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(26, 19, 16, 0.18);
      padding: 6px;
      z-index: 120;
      scrollbar-width: thin;
      scrollbar-color: #D4CCC0 transparent;
    }
    .fx-search-pop::-webkit-scrollbar { width: 5px; background: transparent; }
    .fx-search-pop::-webkit-scrollbar-thumb { background: #D4CCC0; border-radius: 9999px; }
    .fx-pop-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      text-align: left;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      cursor: grab;
      font-family: inherit;
    }
    .fx-pop-item:hover { border-color: var(--forest); background: var(--forest-subtle); }
    .fx-pop-item:active { cursor: grabbing; }
    .fx-pop-item.dragging { opacity: 0.5; }
    .fx-pop-title { font-size: 12px; font-weight: 700; color: #1A1310; }
    .fx-pop-meta { font-family: monospace; font-size: 10px; color: var(--text-muted); }
    .fx-pop-empty { font-size: 11px; color: var(--text-muted); padding: 10px; text-align: center; }
    .fx-col-body.drop-target { outline: 2px dashed #2C4A3E; outline-offset: -2px; background-color: #E8EFEA; border-radius: 8px; }
    .fx-week {
      display: grid;
      grid-template-columns: repeat(5, minmax(130px, 1fr));
      gap: 10px;
      align-items: stretch;
      flex: 1;
      min-height: 0;
      min-width: 650px;
    }
    @media (max-width: 900px) {
      .fx-week { grid-template-columns: repeat(2, minmax(0, 1fr)); min-width: 0; }
    }
    @media (max-width: 640px) {
      .fx-week { grid-template-columns: minmax(0, 1fr); min-width: 0; }
    }
    .fx-col {
      background: #FBF9F4;
      border: 1px solid var(--border-warm);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .fx-col.is-today { background: #E8EFEA; border-color: var(--forest); }
    .fx-col-head { padding: 8px 10px 10px; box-shadow: inset 0 -1px 0 var(--border-warm); }
    .fx-col.is-today .fx-col-head { background: rgba(44, 74, 62, 0.12); }
    .fx-col-dow { font-size: 10px; font-weight: 700; color: #6E665E; }
    .fx-col-num { font-size: 22px; font-weight: 500; color: #1A1310; line-height: 1.2; }
    .fx-col-count { font-size: 10px; font-weight: 700; color: var(--forest); }
    .fx-col-body { display: flex; flex-direction: column; gap: 6px; padding: 8px; flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #D4CCC0 transparent; }
    .fx-col-body::-webkit-scrollbar { width: 5px; background: transparent; }
    .fx-col-body::-webkit-scrollbar-track { background: transparent; }
    .fx-col-body::-webkit-scrollbar-thumb { background: #D4CCC0; border-radius: 9999px; }
    .fx-col-body::-webkit-scrollbar-thumb:hover { background: #2C4A3E; }
    .fx-event {
      display: flex;
      align-items: stretch;
      background: rgba(44, 74, 62, 0.08);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      padding: 0;
      overflow: hidden;
    }
    .fx-event:hover { background: rgba(44, 74, 62, 0.16); }
    .fx-event .fx-bar { width: 3px; flex-shrink: 0; background: var(--fx-bar, #2C4A3E); }
    .fx-event .fx-event-name { padding: 6px; font-size: 12px; font-weight: 600; color: #1A1310; line-height: 1.35; }
    .fx-event[draggable="true"] { cursor: grab; }
    .fx-event[draggable="true"]:active { cursor: grabbing; }
    .fx-event { position: relative; }
    .fx-event .fx-event-name { flex: 1; min-width: 0; padding-right: 28px; }
    .fx-del {
      position: absolute;
      top: 4px;
      right: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: 1px solid transparent;
      background: transparent;
      color: #8A7F74;
      cursor: pointer;
      padding: 0;
    }
    .fx-del:hover { color: #AB4D29; background: #FAF0EB; border-color: #E5C9B8; }
    .fx-del:focus-visible { outline: 2px solid #2C4A3E; outline-offset: 1px; }
    .fx-trash {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px dashed var(--border-accent);
      border-radius: 10px;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 10px;
    }
    .fx-trash.drop-target-trash {
      outline: 2px dashed #D96B43;
      outline-offset: -2px;
      background-color: #FAF0EB;
      color: #AB4D29;
    }
    .fx-add {
      border: 1px dashed var(--border-accent);
      background: transparent;
      border-radius: 6px;
      color: var(--forest);
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      padding: 6px;
      cursor: pointer;
    }
    .fx-add:hover { background: var(--forest-subtle); }
    .fx-empty { font-size: 11px; color: var(--text-muted); text-align: center; padding: 8px 0; }
    .cal-queue-row {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto;
      gap: 8px;
      align-items: end;
      border: 1px solid var(--border-warm);
      border-radius: 8px;
      padding: 10px 12px;
      background: var(--surface-subtle);
    }
    @media (max-width: 640px) {
      .cal-queue-row { grid-template-columns: minmax(0, 1fr); }
    }
    .food-card {
      background: var(--surface);
      border: 1px solid var(--border-warm);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 2px rgba(26, 19, 16, 0.04);
    }
    .food-img-box {
      width: 100%;
      height: 150px;
      background-color: var(--surface-subtle);
      overflow: hidden;
      flex-shrink: 0;
    }
    .food-img-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .food-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .status-on { background: var(--forest); }
    .status-off { background: var(--terracotta); }
    .skeleton {
      border-radius: 12px;
      border: 1px solid var(--border-warm);
      background: var(--surface-subtle);
      min-height: 220px;
      animation: pulse 1.2s ease-in-out infinite;
    }
    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    .empty-box {
      border: 1px dashed var(--border-accent);
      border-radius: 12px;
      background: var(--surface);
      padding: 22px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Custom dropdown: visual parity with frontend CustomDropdown */
    .dd { position: relative; }
    .dd-trigger {
      width: 100%;
      border-radius: 8px;
      border: 1px solid #DED8CE;
      background: #F4F0E8;
      color: #1A1310;
      padding: 10px 14px;
      font-size: 12px;
      font-family: inherit;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      cursor: pointer;
      box-shadow: 0 1px 3px 0 rgba(26, 19, 16, 0.05), 0 1px 2px -1px rgba(26, 19, 16, 0.05);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .dd-trigger:hover { border-color: #453C36; }
    .dd-trigger.open, .dd-trigger:focus-visible {
      border-color: #2C4A3E;
      box-shadow: 0 0 0 1px rgba(44, 74, 62, 0.2);
    }
    .dd-value {
      font-weight: 600;
      color: #1A1310;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }
    .dd-chev {
      width: 16px;
      height: 16px;
      color: #8C8276;
      flex-shrink: 0;
      transition: transform 0.2s ease-out, color 0.15s;
    }
    .dd-trigger.open .dd-chev { transform: rotate(180deg); color: #2C4A3E; }
    .dd-menu {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 30;
      margin-top: 6px;
      margin-bottom: 0;
      max-height: 256px;
      overflow-y: auto;
      border-radius: 12px;
      border: 1px solid #DED8CE;
      background: #FDFBF7;
      padding: 6px;
      box-shadow: 0 10px 15px -3px rgba(26, 19, 16, 0.08), 0 4px 6px -4px rgba(26, 19, 16, 0.04);
      list-style: none;
    }
    .dd-menu[hidden] { display: none; }
    .dd-menu li {
      padding: 10px;
      border-radius: 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      cursor: pointer;
      color: #1A1310;
      transition: background 0.15s;
    }
    .dd-menu li:hover, .dd-menu li.hl { background: #F7F4EE; }
    .dd-menu li.sel { background: #E8EFEA; color: #2C4A3E; font-weight: 700; }
    .dd-opt-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
    .dd-opt-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dd-opt-desc { font-size: 11px; color: #6E665E; line-height: 1.3; }
    .dd-menu li.sel .dd-opt-desc { color: rgba(44, 74, 62, 0.8); }
    .dd-check { width: 14px; height: 14px; color: #2C4A3E; flex-shrink: 0; display: none; }
    .dd-menu li.sel .dd-check { display: block; }
    .dd-filter { width: 100%; border: 1px solid #DED8CE; background: #F4F0E8; border-radius: 8px; padding: 8px 10px; font-size: 12px; font-family: inherit; color: #1A1310; outline: none; margin-bottom: 6px; flex-shrink: 0; }
    .dd-filter:focus { border-color: #2C4A3E; background: #FFFFFF; }
    .dd-menu ul.dd-opts { list-style: none; margin: 0; padding: 0; }
    #tr-food-list:not([hidden]) { display: flex; flex-direction: column; overflow: hidden; }
    #tr-food-list .dd-opts { overflow-y: auto; min-height: 0; max-height: 208px; }
    .dd-opt-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    .dd-empty { padding: 10px; font-size: 12px; color: #6E665E; text-align: center; }

    /* Console log container */
    .console-box {
      background: #1A1310;
      color: #E2DBD3;
      border-radius: 8px;
      padding: 18px;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.6;
      border: 1px solid #352B24;
    }
    .log-green { color: #31C48D; }
    .log-teal { color: #38BDF8; }
    .log-amber { color: #FBBF24; }
  </style>
</head>
<body>
  <header>
    <div class="header-left">
      <div class="brand-badge-logo" title="NutriDaily Indonesia (Admin Tele-Nutritionist)">
        <svg viewBox="0 0 100 100" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NutriDaily Admin">
          <circle cx="50" cy="50" r="43" stroke="#2C4A3E" stroke-width="4.5" />
          <path d="M22 52 C 22 71, 34 81, 50 81 C 66 81, 78 71, 78 52 Z" fill="#2C4A3E" />
          <line x1="26" y1="50" x2="74" y2="50" stroke="#FDFBF7" stroke-width="2.5" stroke-linecap="round" />
          <path d="M50 48 C 43 38, 37 26, 50 16 C 58 26, 54 38, 50 48 Z" fill="#2C4A3E" />
          <path d="M52 48 C 58 40, 68 32, 66 18 C 54 22, 52 38, 52 48 Z" fill="#D96B43" />
        </svg>
      </div>
      <div class="title-row">
        <h1>NutriDaily</h1>
        <span class="status-badge">Admin</span>
      </div>
    </div>

    <nav class="header-actions" aria-label="Navigasi portal pegawai">
      <a href="/" class="nav-btn" title="Beranda portal internal">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>Beranda</span>
      </a>
      <a href="/kds" class="nav-btn" title="Layar dapur sentral (KDS)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="18"></rect><rect x="14" y="3" width="7" height="18"></rect></svg>
        <span>Dapur</span>
      </a>
      <a href="/admin" class="nav-btn active" title="Portal admin & tele-gizi">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span>Admin</span>
      </a>
      <a href="http://localhost:3000" target="_blank" class="nav-btn" title="Web pelanggan (Port 3000)">
        <span>Web</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </a>
    </nav>
  </header>

  <div class="admin-wrapper">
    <!-- Sidebar Navigasi Modul Admin -->
    <aside class="tab-bar admin-sidebar" role="tablist" aria-orientation="vertical" aria-label="Navigasi modul admin">
      <div class="sidebar-meta">
        <span class="sidebar-tag">Modul operasional</span>
        <span class="sidebar-title">Tele-gizi &amp; sistem</span>
      </div>

      <nav class="sidebar-nav">
        <button type="button" role="tab" id="tabbtn-crm" aria-selected="true" aria-controls="tab-crm" class="tab-item active" data-tab="crm" onclick="switchTab('crm', this)" title="CRM dan tele-gizi">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <span>CRM tele-gizi</span>
        </button>
        <button type="button" role="tab" id="tabbtn-recipes" aria-selected="false" aria-controls="tab-recipes" class="tab-item" data-tab="recipes" onclick="switchTab('recipes', this)" title="Katalog resep gizi (60)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          <span>Resep</span>
        </button>
        <button type="button" role="tab" id="tabbtn-transactions" aria-selected="false" aria-controls="tab-transactions" class="tab-item" data-tab="transactions" onclick="switchTab('transactions', this)" title="Arus transaksi dan webhook">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          <span>Transaksi webhook</span>
        </button>
        <button type="button" role="tab" id="tabbtn-accounts" aria-selected="false" aria-controls="tab-accounts" class="tab-item" data-tab="accounts" onclick="switchTab('accounts', this)" title="Akun terdaftar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>Akun</span>
        </button>
        <button type="button" role="tab" id="tabbtn-foods" aria-selected="false" aria-controls="tab-foods" class="tab-item" data-tab="foods" onclick="switchTab('foods', this)" title="Kelola master database makanan">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16.5 9.4 7.55 4.24"></path><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
          <span>Kelola makanan</span>
        </button>
        <button type="button" role="tab" id="tabbtn-calendar" aria-selected="false" aria-controls="tab-calendar" class="tab-item" data-tab="calendar" onclick="switchTab('calendar', this)" title="Kalender ketersediaan menu">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Kalender</span>
        </button>
        <button type="button" role="tab" id="tabbtn-transparency" aria-selected="false" aria-controls="tab-transparency" class="tab-item" data-tab="transparency" onclick="switchTab('transparency', this)" title="Transparansi bahan &amp; Clean Label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6"></path><path d="M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3"></path></svg>
          <span>Transparansi bahan</span>
        </button>
      </nav>

      <div class="sidebar-status-box">
        <span class="sidebar-status-dot"></span>
        <div class="sidebar-status-text">
          <span class="sidebar-status-label">Server internal</span>
          <span class="sidebar-status-val">Port 4000 • Online</span>
        </div>
      </div>
    </aside>

    <main class="admin-main">

    <!-- Tab 1: CRM & Medical Notes -->
    <div id="tab-crm" class="tab-content active">
      <div class="table-container">
        <div class="table-header-bar">
          <div>
            <h2 style="font-size: 14px; font-weight: 700;">Segmentasi Pelanggan RFM & Rekam Gizi Klinis</h2>
            <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              Data medis terlindungi enkripsi AES-256-GCM sesuai amanat UU PDP No. 27/2022.
            </p>
          </div>
          <input type="text" class="table-search" placeholder="Cari nama atau rekam alergi..." onkeyup="filterCrmTable(this.value)">
        </div>
        <div id="crm-summary" style="padding: 10px 14px; font-size: 12px; color: var(--text-muted);">Memuat data akun terdaftar...</div>

        <table>
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>Segmen RFM</th>
              <th>Recency</th>
              <th>Frequency</th>
              <th>Nilai (M)</th>
              <th>Catatan Tele-Gizi (AES-256 Decrypted)</th>
            </tr>
          </thead>
          <tbody id="crm-body">
            <tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Memuat...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: 60 Recipes Catalog with Visual Food Photography -->
    <div id="tab-recipes" class="tab-content">
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="font-size: 15px; font-weight: 700;">Repositori Formularium 60 Menu Gizi</h2>
          <p style="font-size: 12px; color: var(--text-muted);">Sertifikasi uji independen SIG Lab & Sucofindo.</p>
        </div>
      </div>

      <div class="recipe-grid">
        <!-- Recipe 1: Salmon -->
        <div class="recipe-card">
          <div class="recipe-img-box">
            <img src="/images/meals/salmon_meal.jpg" alt="Sous-Vide Atlantic Salmon" loading="lazy" />
          </div>
          <div class="recipe-body">
            <div class="recipe-top">
              <span class="recipe-sku">ND-WL-001</span>
              <span class="lab-tag">SIG LAB TERVERIFIKASI</span>
            </div>
            <div class="recipe-name">Sous-Vide Atlantic Salmon with Wild Red Rice & Asparagus</div>
            <p style="font-size: 11px; color: var(--text-muted);">Kategori: Weight Loss (Lean & Sculpt)</p>
            <div class="macro-bar">
              <span class="macro-cal">440 kkal</span>
              <span class="macro-p">P: 42g</span>
              <span class="macro-c">C: 36g</span>
              <span class="macro-f">F: 14g</span>
              <span style="color: var(--forest);">GI: 42</span>
            </div>
          </div>
        </div>

        <!-- Recipe 2: Wagyu -->
        <div class="recipe-card">
          <div class="recipe-img-box">
            <img src="/images/meals/wagyu_meal.jpg" alt="Sous-Vide Wagyu Rump" loading="lazy" />
          </div>
          <div class="recipe-body">
            <div class="recipe-top">
              <span class="recipe-sku">ND-MG-002</span>
              <span class="lab-tag">SUCOFINDO TERVERIFIKASI</span>
            </div>
            <div class="recipe-name">Sous-Vide Wagyu Rump 9+ with Truffle Mashed Cauliflower</div>
            <p style="font-size: 11px; color: var(--text-muted);">Kategori: Muscle Gain (Fit & Build)</p>
            <div class="macro-bar">
              <span class="macro-cal">680 kkal</span>
              <span class="macro-p">P: 58g</span>
              <span class="macro-c">C: 42g</span>
              <span class="macro-f">F: 28g</span>
              <span style="color: var(--forest);">GI: 38</span>
            </div>
          </div>
        </div>

        <!-- Recipe 3: Chicken -->
        <div class="recipe-card">
          <div class="recipe-img-box">
            <img src="/images/meals/chicken_meal.jpg" alt="Slow-Braised Chicken Breast" loading="lazy" />
          </div>
          <div class="recipe-body">
            <div class="recipe-top">
              <span class="recipe-sku">ND-TD-003</span>
              <span class="lab-tag">SIG LAB TERVERIFIKASI</span>
            </div>
            <div class="recipe-name">Slow-Braised Free-Range Chicken Breast with Herb Quinoa</div>
            <p style="font-size: 11px; color: var(--text-muted);">Kategori: Therapeutic Diet (DASH & Diabetes)</p>
            <div class="macro-bar">
              <span class="macro-cal">490 kkal</span>
              <span class="macro-p">P: 46g</span>
              <span class="macro-c">C: 40g</span>
              <span class="macro-f">F: 12g</span>
              <span style="color: var(--forest);">GI: 44</span>
            </div>
          </div>
        </div>

        <!-- Recipe 4: Tofu & Tempeh Medallion -->
        <div class="recipe-card">
          <div class="recipe-img-box">
            <img src="/images/meals/salmon_meal.jpg" alt="Pan-Seared Organic Tofu" loading="lazy" />
          </div>
          <div class="recipe-body">
            <div class="recipe-top">
              <span class="recipe-sku">ND-MD-004</span>
              <span class="lab-tag">SIG LAB TERVERIFIKASI</span>
            </div>
            <div class="recipe-name">Pan-Seared Organic Tofu & Tempeh Medallion with Edamame Puree</div>
            <p style="font-size: 11px; color: var(--text-muted);">Kategori: Maintenance (Vitality Daily)</p>
            <div class="macro-bar">
              <span class="macro-cal">420 kkal</span>
              <span class="macro-p">P: 32g</span>
              <span class="macro-c">C: 44g</span>
              <span class="macro-f">F: 11g</span>
              <span style="color: var(--forest);">GI: 35</span>
            </div>
          </div>
        </div>

        <!-- Recipe 5: Atlantic Salmon Rosemary -->
        <div class="recipe-card">
          <div class="recipe-img-box">
            <img src="/images/meals/salmon_rosemary.jpg" alt="Atlantic Salmon Panggang Rosemary" loading="lazy" />
          </div>
          <div class="recipe-body">
            <div class="recipe-top">
              <span class="recipe-sku">ND-WL-005</span>
              <span class="lab-tag">SIG LAB TERVERIFIKASI</span>
            </div>
            <div class="recipe-name">Atlantic salmon panggang rosemary dengan salad kentang ungu</div>
            <p style="font-size: 11px; color: var(--text-muted);">Kategori: Weight loss (lean & sculpt)</p>
            <div class="macro-bar">
              <span class="macro-cal">452 kkal</span>
              <span class="macro-p">P: 42g</span>
              <span class="macro-c">C: 35g</span>
              <span class="macro-f">F: 15g</span>
              <span style="color: var(--forest);">GI: 40</span>
            </div>
          </div>
        </div>

        <!-- Recipe 6: Wagyu Chimichurri -->
        <div class="recipe-card">
          <div class="recipe-img-box">
            <img src="/images/meals/wagyu_striploin.jpg" alt="Daging Wagyu Striploin Bakar Chimichurri" loading="lazy" />
          </div>
          <div class="recipe-body">
            <div class="recipe-top">
              <span class="recipe-sku">ND-MG-006</span>
              <span class="lab-tag">SUCOFINDO TERVERIFIKASI</span>
            </div>
            <div class="recipe-name">Daging wagyu striploin bakar chimichurri dengan jagung manis bakar</div>
            <p style="font-size: 11px; color: var(--text-muted);">Kategori: Muscle gain (fit & build)</p>
            <div class="macro-bar">
              <span class="macro-cal">695 kkal</span>
              <span class="macro-p">P: 54g</span>
              <span class="macro-c">C: 44g</span>
              <span class="macro-f">F: 29g</span>
              <span style="color: var(--forest);">GI: 39</span>
            </div>
          </div>
        </div>

        <!-- Recipe 7: Ayam Panggang Bumbu Rujak -->
        <div class="recipe-card">
          <div class="recipe-img-box">
            <img src="/images/meals/chicken_rujak.jpg" alt="Dada Ayam Bakar Bumbu Rujak Kelapa Muda" loading="lazy" />
          </div>
          <div class="recipe-body">
            <div class="recipe-top">
              <span class="recipe-sku">ND-TD-007</span>
              <span class="lab-tag">SIG LAB TERVERIFIKASI</span>
            </div>
            <div class="recipe-name">Dada ayam bakar bumbu rujak kelapa muda dengan tumis buncis baby</div>
            <p style="font-size: 11px; color: var(--text-muted);">Kategori: Therapeutic DASH (low sodium)</p>
            <div class="macro-bar">
              <span class="macro-cal">475 kkal</span>
              <span class="macro-p">P: 44g</span>
              <span class="macro-c">C: 37g</span>
              <span class="macro-f">F: 13g</span>
              <span style="color: var(--forest);">GI: 43</span>
            </div>
          </div>
        </div>

        <!-- Recipe 8: Ayam Suwir Sambal Matah -->
        <div class="recipe-card">
          <div class="recipe-img-box">
            <img src="/images/meals/chicken_matah.jpg" alt="Dada Ayam Suwir Kukus Sambal Matah" loading="lazy" />
          </div>
          <div class="recipe-body">
            <div class="recipe-top">
              <span class="recipe-sku">ND-VT-008</span>
              <span class="lab-tag">SIG LAB TERVERIFIKASI</span>
            </div>
            <div class="recipe-name">Dada ayam suwir kukus sambal matah kecombrang dengan nasi barley</div>
            <p style="font-size: 11px; color: var(--text-muted);">Kategori: Vitality daily (metabolic balance)</p>
            <div class="macro-bar">
              <span class="macro-cal">445 kkal</span>
              <span class="macro-p">P: 43g</span>
              <span class="macro-c">C: 38g</span>
              <span class="macro-f">F: 12g</span>
              <span style="color: var(--forest);">GI: 41</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Transaction Stream & Webhook -->
    <div id="tab-transactions" class="tab-content">
      <div style="background: var(--surface); border: 1px solid var(--border-warm); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 14px;">
        <div>
          <h2 style="font-size: 15px; font-weight: 700;">Pemantauan Arus Transaksi & Webhook Midtrans</h2>
          <p style="font-size: 12px; color: var(--text-muted);">Audit log sinkronisasi payment gateway, bullmq worker, dan bot notifikasi.</p>
        </div>

        <div class="console-box">
          <p class="log-amber">[2026-10-02 20:00:00 WIB] [SISTEM KUNCI] CUTOFF H+1 LOCKED untuk 1.842 pesanan aktif besok.</p>
          <p class="log-green">[2026-10-02 21:14:32 WIB] Midtrans Webhook: ND-INV-9821 settled (Rp 1.700.000) - Idempotency Verified.</p>
          <p class="log-teal">[2026-10-02 21:30:05 WIB] WhatsApp Notification Worker: Invoice PDF dikirim ke +628123456789.</p>
          <p class="log-amber">[2026-10-03 05:00:00 WIB] BullMQ Cron: Tiket produksi harian KDS berhasil diterbitkan (420 tiket batch 1).</p>
          <p class="log-green">[2026-10-03 09:15:22 WIB] Health Profile Synced: Hasil kalkulasi TDEE pelanggan baru disimpan.</p>
          <p class="log-teal">[2026-10-03 10:30:00 WIB] Driver Fleet Dispatch: 4 armada berpendingin diberangkatkan dari Sudirman.</p>
        </div>
      </div>
    </div>
    <!-- Tab 4: Akun Terdaftar -->
    <div id="tab-accounts" class="tab-content">
      <div class="table-container">
        <div class="table-header-bar">
          <div>
            <h2 style="font-size: 14px; font-weight: 700;">Daftar Akun Terdaftar</h2>
            <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Atribut lengkap setiap akun pelanggan dan pegawai.</p>
          </div>
          <button class="kds-btn" style="padding:6px 12px;" onclick="loadAccounts()">Muat ulang</button>
        </div>
        <div id="accounts-summary" style="padding: 10px 14px; font-size: 12px; color: var(--text-muted);">Klik tab ini untuk memuat data akun.</div>
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nama lengkap</th><th>Email</th><th>Telepon</th><th>Peran</th><th>Terverifikasi</th>
                <th>Verifikasi email</th><th>Login terakhir</th><th>Gagal login</th><th>Terkunci sampai</th>
                <th>Versi token</th><th>Ganti sandi</th><th>Dihapus</th><th>Dibuat</th><th>Diperbarui</th>
              </tr>
            </thead>
            <tbody id="accounts-body"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 5: Kelola makanan -->
    <div id="tab-foods" class="tab-content">
      <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:14px;">
        <div>
          <p class="eyebrow">Katalog internal</p>
          <h2 style="font-size:22px; font-weight:700;">Kelola makanan</h2>
          <p style="font-size:12px; color: var(--text-muted);">Simpan ke 60 rotasi resep. Data masuk ke tabel Recipe dan tampil di verifikasi QR pelanggan.</p>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
          <p id="foods-count" style="font-size:12px; color: var(--text-muted); margin:0;">Memuat katalog...</p>
          <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end;">
            <button class="btn-primary" type="button" onclick="importCatalogFoods()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
              <span>Tarik 8 resep katalog ke daftar kelola</span>
            </button>
            <button class="btn-ghost" type="button" onclick="loadFoods()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              <span>Muat ulang katalog</span>
            </button>
          </div>
        </div>
      </div>
      <div style="margin-bottom:16px;">
        <div class="food-form-card">
          <p class="eyebrow">Formulir resep</p>
          <h3 style="font-size:16px; font-weight:700; margin-top:4px;">Tambah atau ubah data makanan</h3>
          <form id="food-form" onsubmit="return submitFood(event)">
            <input type="hidden" id="food-id" />
            <div class="food-field-grid">
              <div class="field"><span class="field-label">Kode SKU</span><p id="food-sku-readout" style="font-family:monospace; font-size:12px; font-weight:700; color:var(--forest); background:var(--forest-subtle); border:1px dashed var(--border-accent); border-radius:8px; padding:8px 12px; margin:0;">SKU dibuat otomatis saat disimpan</p></div>
              <div class="field">
                <span class="field-label" id="food-category-label">Kategori</span>
                <input type="hidden" id="food-category" value="WEIGHT_LOSS_LEAN_SCULPT" />
                <div class="dd" id="food-category-dd">
                  <button type="button" class="dd-trigger" id="food-category-btn" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="food-category-label food-category-btn-label" aria-controls="food-category-list">
                    <span class="dd-value" id="food-category-btn-label">Weight loss</span>
                    <svg class="dd-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  <ul class="dd-menu" id="food-category-list" role="listbox" aria-labelledby="food-category-label" hidden>
                    <li role="option" aria-selected="true" data-value="WEIGHT_LOSS_LEAN_SCULPT" tabindex="-1">
                      <span class="dd-opt-main"><span class="dd-opt-label">Weight loss</span><span class="dd-opt-desc">Defisit 1.200 sampai 1.400 kkal per hari</span></span>
                      <svg class="dd-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </li>
                    <li role="option" aria-selected="false" data-value="MUSCLE_GAIN_FIT_BUILD" tabindex="-1">
                      <span class="dd-opt-main"><span class="dd-opt-label">Muscle gain</span><span class="dd-opt-desc">Surplus 2.000 sampai 2.400 kkal per hari</span></span>
                      <svg class="dd-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </li>
                    <li role="option" aria-selected="false" data-value="MAINTENANCE_VITALITY_DAILY" tabindex="-1">
                      <span class="dd-opt-main"><span class="dd-opt-label">Maintenance</span><span class="dd-opt-desc">Seimbang 1.600 sampai 1.800 kkal per hari</span></span>
                      <svg class="dd-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </li>
                    <li role="option" aria-selected="false" data-value="THERAPEUTIC_DIET" tabindex="-1">
                      <span class="dd-opt-main"><span class="dd-opt-label">Therapeutic</span><span class="dd-opt-desc">DASH dan rendah natrium untuk hipertensi</span></span>
                      <svg class="dd-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </li>
                  </ul>
                </div>
              </div>
              <label class="field field-wide"><span class="field-label">Judul menu</span><input class="input" id="food-title" required placeholder="Contoh: Salmon panggang rosemary dengan kentang ungu" /></label>
              <label class="field"><span class="field-label">Kalori (kkal)</span><input class="input" id="food-cal" type="number" step="0.1" required placeholder="452" /></label>
              <label class="field"><span class="field-label">Protein (g)</span><input class="input" id="food-pro" type="number" step="0.1" required placeholder="42" /></label>
              <label class="field"><span class="field-label">Karbo (g)</span><input class="input" id="food-carb" type="number" step="0.1" required placeholder="35" /></label>
              <label class="field"><span class="field-label">Lemak (g)</span><input class="input" id="food-fat" type="number" step="0.1" required placeholder="15" /></label>
              <label class="field"><span class="field-label">Kode QR verifikasi</span><input class="input" id="food-qr" required placeholder="ND-VERIFY-XXX-2026" /></label>
              <div class="field">
                <span class="field-label">Foto makanan (unggah)</span>
                <input type="hidden" id="food-img" />
                <input class="input" id="food-file" type="file" accept="image/jpeg,image/png,image/webp" onchange="uploadFoodImage(this)" aria-label="Pilih berkas foto makanan" />
                <img id="food-preview" alt="Pratinjau foto makanan" style="display:none; width:100%; max-height:180px; object-fit:cover; border-radius:8px; border:1px solid var(--border-warm);" />
                <p style="font-size:11px; color: var(--text-muted); margin:0;">JPG, PNG, atau WebP maksimal 2 MB. Tersimpan di database.</p>
              </div>
              <label class="field"><span class="field-label">Alergen (pisah koma)</span><input class="input" id="food-allergen" placeholder="PEANUT, GLUTEN" /></label>
              <label class="check-row"><input id="food-active" type="checkbox" checked /> Tampilkan di katalog pelanggan</label>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:14px;">
              <button id="food-submit-btn" class="btn-primary" type="submit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                <span>Simpan ke katalog resep</span>
              </button>
              <button class="btn-ghost" type="button" onclick="resetFoodForm()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                <span>Bersihkan formulir</span>
              </button>
            </div>
          </form>
          <p id="food-msg" role="status" style="font-size:12px; margin-top:10px; color: var(--text-muted);"></p>
        </div>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <input type="text" id="food-filter" class="input" style="flex:1;" placeholder="Cari SKU, nama makanan, kategori, atau kode QR..." onkeyup="filterFoodCards(this.value)" aria-label="Cari makanan di daftar kelola" />
      </div>
      <div id="foods-grid" class="food-manager-grid" aria-live="polite"></div>
    </div>

    <!-- Tab 6: Kalender ketersediaan -->
    <div id="tab-calendar" class="tab-content">
      <div class="fx-shell">
        <aside class="fx-side" aria-label="Mini kalender dan agenda">
          <div class="fx-month-row">
            <div class="fx-month-title"><span id="fx-month-name">-</span> <span id="fx-month-year" class="fx-year">-</span></div>
            <div class="fx-mini-nav">
              <button type="button" class="fx-icon-btn" onclick="fxMiniNav(-1)" aria-label="Bulan lalu">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button type="button" class="fx-icon-btn" onclick="fxMiniNav(1)" aria-label="Bulan depan">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
          <div id="fx-mini" class="fx-mini" aria-label="Kalender mini"></div>
          <div id="fx-agenda" class="fx-agenda" aria-live="polite"></div>
          <p id="cal-summary" class="fx-side-foot">Memuat kalender...</p>
        </aside>
        <div class="fx-main">
          <div class="fx-toolbar">
            <div class="fx-arrows" role="group" aria-label="Navigasi minggu">
              <button type="button" class="fx-nav-btn fx-nav-side" onclick="calNav(-1)" aria-label="Minggu lalu">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button type="button" class="fx-nav-btn fx-nav-mid" onclick="calToday()"><span>Minggu ini</span></button>
              <button type="button" class="fx-nav-btn fx-nav-side" onclick="calNav(1)" aria-label="Minggu depan">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
            <span id="cal-week-label" class="fx-week-label">-</span>
            <div class="fx-legend" aria-label="Legenda warna kategori">
              <span class="fx-legend-item"><i style="background:#2C4A3E;"></i>Weight loss</span>
              <span class="fx-legend-item"><i style="background:#D96B43;"></i>Muscle gain</span>
              <span class="fx-legend-item"><i style="background:#4A7C9B;"></i>Therapeutic diet</span>
              <span class="fx-legend-item"><i style="background:#B7791F;"></i>Maintenance</span>
            </div>
            <div class="fx-search" style="position:relative;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="fx-search" placeholder="Cari makanan..." onkeyup="fxFoodSearch(this.value)" onfocus="fxFoodSearch(this.value)" aria-label="Cari makanan di database" autocomplete="off" />
              <div id="fx-search-pop" class="fx-search-pop" aria-live="polite" hidden></div>
            </div>
          </div>
          <div id="cal-grid" class="fx-week" aria-live="polite"></div>
          <p id="cal-msg" role="status" style="font-size:12px; color: var(--text-muted); margin:10px 2px 0;">Seret kartu makanan antar hari untuk menjadwalkan. Seret ke tempat sampah untuk mengeluarkan dari hari itu.</p>
          <div id="fx-trash" class="fx-trash" aria-label="Tarik makanan ke sini untuk mengeluarkan dari jadwal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Tarik makanan ke sini untuk mengeluarkan dari jadwal</span>
          </div>
        </div>
      </div>
      <div id="cal-modal" style="display:none; position:fixed; inset:0; z-index:200; align-items:center; justify-content:center; background:rgba(26,19,16,0.45); padding:16px;" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
        <div style="background:var(--surface); border:1px solid var(--border-warm); border-radius:14px; padding:18px; width:100%; max-width:420px; box-shadow:0 10px 30px rgba(26,19,16,0.25);">
          <p class="eyebrow">Ubah jadwal tayang</p>
          <h3 id="cal-modal-title" style="font-size:16px; font-weight:700; margin-top:4px;">-</h3>
          <p id="cal-modal-sub" style="font-family:monospace; font-size:11px; color: var(--text-muted); margin:4px 0 0;">-</p>
          <input type="hidden" id="cal-modal-id" />
          <div id="cal-modal-food-wrap" class="field" style="margin-top:12px;">
            <span class="field-label">Makanan</span>
            <select id="cal-modal-food" class="input"></select>
          </div>
          <div class="food-field-grid">
            <label class="field"><span class="field-label">Tayang dari</span><input class="input" id="cal-modal-from" type="date" /></label>
            <label class="field"><span class="field-label">Tayang sampai</span><input class="input" id="cal-modal-to" type="date" /></label>
          </div>
          <div class="field" style="margin-top:12px;"><span class="field-label">Biaya bahan per porsi (Rp)</span><input class="input" id="cal-modal-cost" type="number" min="0" step="500" placeholder="18500" /></div>
          <label class="check-row" style="margin-top:12px;"><input id="cal-modal-active" type="checkbox" /> Aktif dan bisa dipesan</label>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:14px;">
            <button class="btn-primary" type="button" onclick="saveCalEditor()"><span>Simpan jadwal</span></button>
            <button class="btn-ghost" type="button" onclick="closeCalEditor()"><span>Batal</span></button>
          </div>
          <p id="cal-modal-msg" role="status" style="font-size:12px; margin-top:10px; color: var(--text-muted);"></p>
        </div>
      </div>
    </div>

    <!-- Tab 7: Transparansi bahan -->
    <div id="tab-transparency" class="tab-content">
      <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:14px;">
        <div>
          <p class="eyebrow">Data tampil pelanggan</p>
          <h2 style="font-size:22px; font-weight:700;">Transparansi bahan</h2>
          <p style="font-size:12px; color: var(--text-muted);">Kelola rincian gramatur, asal petani mitra, dan uji laboratorium per makanan. Tersimpan di database dan tampil di section transparansi pelanggan.</p>
        </div>
        <p id="tr-count" style="font-size:12px; color: var(--text-muted); margin:0;">Memuat...</p>
      </div>
      <div class="food-form-card" style="margin-bottom:16px;">
        <div class="field" style="max-width:420px;">
          <span class="field-label" id="tr-food-label">Pilih makanan</span>
          <div class="dd" id="tr-food-dd">
            <button type="button" class="dd-trigger" id="tr-food-btn" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="tr-food-label tr-food-btn-label" aria-controls="tr-food-list">
              <span class="dd-value" id="tr-food-btn-label">Memuat...</span>
              <svg class="dd-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="dd-menu" id="tr-food-list" hidden>
              <input class="dd-filter" id="tr-food-filter" type="text" placeholder="Cari nama, SKU, atau kategori..." aria-label="Cari makanan" autocomplete="off" />
              <ul class="dd-opts" id="tr-food-options" role="listbox" aria-labelledby="tr-food-label"></ul>
              <div class="dd-empty" id="tr-food-empty" hidden>Belum ada makanan di database. Tambah dahulu di Kelola makanan.</div>
            </div>
          </div>
        </div>
      </div>
      <div id="tr-form" aria-live="polite"></div>
      <p id="tr-msg" role="status" style="font-size:12px; margin-top:10px; color: var(--text-muted);"></p>
    </div>
    </main>
  </div>

  <script>
    function switchTab(tabKey, el) {
      try {
        if (window.location.hash !== '#' + tabKey && window.history && window.history.replaceState) {
          window.history.replaceState(null, '', '#' + tabKey);
        }
        var main = document.querySelector('.admin-main');
        if (main) {
          if (tabKey === 'calendar') {
            main.classList.add('admin-main-flush');
          } else {
            main.classList.remove('admin-main-flush');
          }
        }
        document.querySelectorAll('.tab-item').forEach(function(b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
          b.setAttribute('tabindex', '-1');
        });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        var btn = el || document.querySelector('.tab-item[data-tab="' + tabKey + '"]');
        if (btn) {
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          btn.removeAttribute('tabindex');
        }
        const target = document.getElementById('tab-' + tabKey);
        if (target) target.classList.add('active');
      } catch (e) { console.error('Gagal pindah tab: ' + e.message); }
      try {
        if (tabKey === 'crm' && typeof loadCrm === 'function') loadCrm();
        if (tabKey === 'accounts' && typeof loadAccounts === 'function') loadAccounts();
        if (tabKey === 'foods' && typeof loadFoods === 'function') loadFoods();
        if (tabKey === 'calendar' && typeof loadCalendar === 'function') loadCalendar();
        if (tabKey === 'transparency' && typeof loadTransparency === 'function') loadTransparency();
        requestAnimationFrame(function() { if (typeof fxFit === 'function') fxFit(); });
      } catch (e) { console.error('Gagal memuat tab ' + tabKey + ': ' + e.message); }
    }

    // Navigasi keyboard tab bar: panah atas/bawah/kiri/kanan, Home, End. Roving tabindex agar fokus rapi.
    (function initTabNav() {
      function tabs() {
        return Array.prototype.slice.call(document.querySelectorAll('.tab-bar .tab-item'));
      }
      function syncPanels() {
        tabs().forEach(function(btn) {
          var panel = document.getElementById('tab-' + btn.getAttribute('data-tab'));
          if (!panel) return;
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', btn.id || '');
        });
      }
      function focusTab(list, idx) {
        var next = (idx + list.length) % list.length;
        list[next].focus();
        switchTab(list[next].getAttribute('data-tab'), list[next]);
      }
      document.addEventListener('DOMContentLoaded', function() {
        var list = tabs();
        syncPanels();
        list.forEach(function(btn) {
          if (btn.classList.contains('active')) { btn.removeAttribute('tabindex'); }
          else { btn.setAttribute('tabindex', '-1'); }
        });
        var bar = document.querySelector('.tab-bar');
        if (bar) {
          bar.addEventListener('keydown', function(e) {
            var items = tabs();
            var idx = items.indexOf(document.activeElement);
            if (idx === -1) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); focusTab(items, idx + 1); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); focusTab(items, idx - 1); }
            else if (e.key === 'Home') { e.preventDefault(); focusTab(items, 0); }
            else if (e.key === 'End') { e.preventDefault(); focusTab(items, items.length - 1); }
          });
        }
        var validTabs = ['crm', 'accounts', 'foods', 'calendar', 'transparency'];
        var hash = (window.location.hash || '').replace('#', '');
        if (hash && validTabs.indexOf(hash) !== -1) {
          if (hash !== 'crm') {
            switchTab(hash);
          }
        }
      });
      window.addEventListener('hashchange', function() {
        var validTabs = ['crm', 'accounts', 'foods', 'calendar', 'transparency'];
        var hash = (window.location.hash || '').replace('#', '');
        if (hash && validTabs.indexOf(hash) !== -1) {
          switchTab(hash);
        }
      });
    })();

    function escapeHtml(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function tagClassFor(tone) {
      if (tone === 'loyal') return 'tag tag-loyal';
      if (tone === 'risk') return 'tag tag-risk';
      return 'tag tag-champion';
    }

    async function loadCrm() {
      var summaryEl = document.getElementById('crm-summary');
      var bodyEl = document.getElementById('crm-body');
      if (!bodyEl) { console.error('Elemen crm-body tidak ditemukan.'); return; }
      try {
        if (summaryEl) summaryEl.textContent = 'Memuat data akun terdaftar...';
        const res = await fetch('/api/v1/admin/crm', { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('Server jawab ' + res.status + '. Restart backend lalu muat ulang halaman ini.');
        const json = await res.json();
        const rows = (json && json.data) || [];
        if (summaryEl) summaryEl.textContent = json.message || (rows.length + ' pelanggan ditemukan dari data akun terdaftar.');
        if (!rows.length) {
          bodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 18px;">Belum ada akun terdaftar. Buat akun baru via halaman register di web pelanggan port 3000, lalu muat ulang halaman ini.</td></tr>';
          return;
        }
        bodyEl.innerHTML = rows.map(function(r) {
          return '<tr>' +
            '<td><strong>' + escapeHtml(r.fullName) + '</strong><br><span style="font-size:11px; color: var(--text-muted);">' + escapeHtml(r.email) + '<br>' + escapeHtml(r.phone) + '</span></td>' +
            '<td><span class="' + tagClassFor(r.segmentTone) + '">' + escapeHtml(r.segment) + '</span><br><span style="font-size:10px; color: var(--text-muted);">' + escapeHtml(r.role) + '</span></td>' +
            '<td>' + escapeHtml(r.recency) + '</td>' +
            '<td>' + escapeHtml(r.frequency) + '</td>' +
            '<td style="font-size:11px; color: var(--text-muted);">Belum ada transaksi</td>' +
            '<td style="max-width: 320px; line-height: 1.4;">' + escapeHtml(r.teleGizi) + '</td>' +
          '</tr>';
        }).join('');
      } catch (e) {
        if (summaryEl) summaryEl.textContent = 'Gagal memuat CRM: ' + e.message;
        bodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center;">Gagal memuat data. Pastikan backend port 4000 aktif.</td></tr>';
      }
    }

    document.addEventListener('error', function(e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && t.getAttribute('data-fallback') && t.src !== t.getAttribute('data-fallback')) {
        t.src = t.getAttribute('data-fallback');
      }
    }, true);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { try { loadCrm(); } catch (e) { console.error(e); } });
    } else {
      try { loadCrm(); } catch (e) { console.error(e); }
    }

    async function loadAccounts() {
      try {
        const res = await fetch('/api/v1/admin/accounts');
        const json = await res.json();
        const rows = json.data || [];
        document.getElementById('accounts-summary').textContent = json.message || '';
        document.getElementById('accounts-body').innerHTML = rows.map(u => '<tr>' +
          '<td style="font-family:monospace; font-size:10px;">' + String(u.id).slice(0,8) + '…</td>' +
          '<td>' + u.fullName + '</td>' +
          '<td>' + u.email + '</td>' +
          '<td>' + u.phone + '</td>' +
          '<td>' + u.role + '</td>' +
          '<td>' + (u.isVerified ? 'Ya' : 'Belum') + '</td>' +
          '<td>' + (u.emailVerifiedAt ? u.emailVerifiedAt.slice(0,10) : '-') + '</td>' +
          '<td>' + (u.lastLoginAt ? u.lastLoginAt.slice(0,16).replace('T',' ') : '-') + '</td>' +
          '<td>' + u.failedLoginCount + '</td>' +
          '<td>' + (u.lockedUntil ? u.lockedUntil.slice(0,10) : '-') + '</td>' +
          '<td>' + u.tokenVersion + '</td>' +
          '<td>' + (u.passwordChangedAt ? u.passwordChangedAt.slice(0,10) : '-') + '</td>' +
          '<td>' + (u.deletedAt ? u.deletedAt.slice(0,10) : 'Aktif') + '</td>' +
          '<td>' + u.createdAt.slice(0,10) + '</td>' +
          '<td>' + u.updatedAt.slice(0,10) + '</td>' +
        '</tr>').join('');
      } catch (e) {
        document.getElementById('accounts-summary').textContent = 'Gagal memuat akun: ' + e.message;
      }
    }

    function categoryLabel(code) {
      var map = {
        WEIGHT_LOSS_LEAN_SCULPT: 'Weight loss',
        MUSCLE_GAIN_FIT_BUILD: 'Muscle gain',
        MAINTENANCE_VITALITY_DAILY: 'Maintenance',
        THERAPEUTIC_DIET: 'Therapeutic'
      };
      return map[code] || code || '-';
    }

    var ACTIVE_MEAL_CAP = 20;
    var ID_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    function todayKeyLocal() {
      var n = new Date();
      var m = String(n.getMonth() + 1);
      if (m.length < 2) m = '0' + m;
      var d = String(n.getDate());
      if (d.length < 2) d = '0' + d;
      return n.getFullYear() + '-' + m + '-' + d;
    }

    function fmtDateId(iso) {
      var s = String(iso || '').slice(0, 10);
      var parts = s.split('-');
      if (parts.length !== 3) return '-';
      return parseInt(parts[2], 10) + ' ' + ID_MONTHS[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    }

    function fmtRupiah(n) {
      if (n == null || n === '') return '-';
      return 'Rp ' + Number(n).toLocaleString('id-ID');
    }

    function foodWindowState(f) {
      var today = todayKeyLocal();
      if (!f.isActive) return 'off';
      if (Array.isArray(f.availableDays) && f.availableDays.length > 0) {
        if (f.availableDays.indexOf(today) !== -1) return 'on';
        var future = f.availableDays.some(function(d) { return d > today; });
        return future ? 'scheduled' : 'expired';
      }
      var from = String(f.availableFrom || '').slice(0, 10);
      var until = String(f.availableUntil || '').slice(0, 10);
      if (from && from > today) return 'scheduled';
      if (until && until < today) return 'expired';
      return 'on';
    }

    function foodWindowLabel(f) {
      if (Array.isArray(f.availableDays) && f.availableDays.length > 0) {
        if (f.availableDays.length === 1) return 'Tayang ' + fmtDateId(f.availableDays[0]);
        return f.availableDays.length + ' hari dipilih (' + fmtDateId(f.availableDays[0]) + ' sampai ' + fmtDateId(f.availableDays[f.availableDays.length - 1]) + ')';
      }
      var from = String(f.availableFrom || '').slice(0, 10);
      var until = String(f.availableUntil || '').slice(0, 10);
      if (!from && !until) return 'Selalu tayang';
      if (from && until) return fmtDateId(from) + ' sampai ' + fmtDateId(until);
      if (from) return 'Mulai ' + fmtDateId(from);
      return 'Sampai ' + fmtDateId(until);
    }

    function foodCardHtml(f) {
      var img = f.imageUrl || '/images/meals/salmon_meal.jpg';
      var active = !!f.isActive;
      return '<article class="food-card" data-search="' + escapeHtml(((f.title || '') + ' ' + (f.skuCode || '') + ' ' + categoryLabel(f.category) + ' ' + (f.category || '') + ' ' + (f.qrVerificationCode || '')).toLowerCase()) + '">' +
        '<div class="food-img-box"><img src="' + escapeHtml(img) + '" alt="' + escapeHtml(f.title || 'Foto makanan') + '" loading="lazy" data-fallback="/images/meals/salmon_meal.jpg" /></div>' +
        '<div class="food-body">' +
          '<div class="recipe-top"><span class="recipe-sku">' + escapeHtml(f.skuCode || '-') + '</span>' +
          '<span style="display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:' + (active ? 'var(--forest)' : 'var(--terracotta)') + ';"><span class="status-dot ' + (active ? 'status-on' : 'status-off') + '"></span>' + (active ? 'Aktif' : 'Nonaktif') + '</span></div>' +
          '<div class="recipe-name">' + escapeHtml(f.title || '-') + '</div>' +
          '<p style="font-size:11px; color: var(--text-muted);">Kategori: ' + escapeHtml(categoryLabel(f.category)) + '</p>' +
          '<p style="font-family:monospace; font-size:11px; color: var(--text-muted);">' + escapeHtml(f.qrVerificationCode || '-') + '</p>' +
          '<div class="macro-bar"><span class="macro-cal">' + escapeHtml(String(f.calories)) + ' kkal</span>' +
          '<span class="macro-p">P: ' + escapeHtml(String(f.proteinGrams)) + 'g</span>' +
          '<span class="macro-c">C: ' + escapeHtml(String(f.carbsGrams)) + 'g</span>' +
          '<span class="macro-f">F: ' + escapeHtml(String(f.fatGrams)) + 'g</span></div>' +
          '<div style="display:flex; gap:8px; margin-top:auto; padding-top:12px;">' +
            '<button class="btn-ghost" style="flex:1; justify-content:center;" data-id="' + f.id + '" onclick="editFoodById(this.dataset.id)">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
              '<span>Ubah data makanan</span></button>' +
            '<button class="btn-ghost" style="flex:1; justify-content:center;" data-id="' + f.id + '" onclick="deleteFood(this.dataset.id)">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
              '<span>Hapus dari katalog</span></button>' +
          '</div>' +
          '<button class="btn-ghost" style="width:100%; justify-content:center; margin-top:8px;" data-id="' + f.id + '" data-active="' + (f.isActive ? '1' : '0') + '" onclick="toggleFoodActive(this.dataset.id, this.dataset.active)">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
            '<span>' + (f.isActive ? 'Nonaktifkan dari katalog' : 'Aktifkan ke katalog') + '</span></button>' +
        '</div></article>';
    }

    async function loadFoods() {
      var grid = document.getElementById('foods-grid');
      var countEl = document.getElementById('foods-count');
      if (!grid) return;
      try {
        grid.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
        if (countEl) countEl.textContent = 'Memuat katalog...';
        const res = await fetch('/api/v1/recipes');
        const json = await res.json();
        const rows = json.data || [];
        window.__foods = rows;
        if (countEl) countEl.textContent = rows.length + ' resep tersimpan di katalog.';
        if (!rows.length) {
          grid.innerHTML = '<div class="empty-box" style="grid-column: 1 / -1;">Belum ada makanan tersimpan. Pilih tarik 8 resep katalog di panel panduan, atau isi formulir di atas lalu simpan ke katalog resep.</div>';
          return;
        }
        grid.innerHTML = rows.map(foodCardHtml).join('');
        var activeFilter = document.getElementById('food-filter');
        if (activeFilter && activeFilter.value) { filterFoodCards(activeFilter.value); }
        updateSkuPreview();
      } catch (e) {
        if (countEl) countEl.textContent = 'Gagal memuat katalog.';
        grid.innerHTML = '<div class="empty-box" style="grid-column: 1 / -1;">Gagal memuat katalog: ' + escapeHtml(e.message) + '. Periksa backend port 4000 lalu pilih muat ulang katalog.</div>';
        document.getElementById('food-msg').textContent = 'Gagal memuat makanan: ' + e.message;
      }
    }

    function skuPrefixFor(category) {
      if (category === 'WEIGHT_LOSS_LEAN_SCULPT') return 'ND-WL';
      if (category === 'MUSCLE_GAIN_FIT_BUILD') return 'ND-MG';
      if (category === 'THERAPEUTIC_DIET') return 'ND-TD';
      return 'ND-VT';
    }

    function nextSkuPreview(category) {
      var prefix = skuPrefixFor(category);
      var max = 0;
      (window.__foods || []).forEach(function(f) {
        var m = /^ND-([A-Z]{2})-(\\d+)$/.exec(f.skuCode || '');
        if (m && ('ND-' + m[1]) === prefix) {
          var n = parseInt(m[2], 10);
          if (n > max) max = n;
        }
      });
      var num = String(max + 1);
      while (num.length < 3) num = '0' + num;
      return prefix + '-' + num;
    }

    function updateSkuPreview() {
      var el = document.getElementById('food-sku-readout');
      var idEl = document.getElementById('food-id');
      if (!el) return;
      if (idEl && idEl.value) return;
      var hidden = document.getElementById('food-category');
      el.textContent = 'SKU berikutnya: ' + nextSkuPreview(hidden ? hidden.value : '') + ' (dibuat otomatis)';
    }

    function filterFoodCards(query) {
      var q = String(query || '').toLowerCase().trim();
      var cards = document.querySelectorAll('#foods-grid .food-card');
      var visible = 0;
      cards.forEach(function(card) {
        var hit = !q || (card.getAttribute('data-search') || '').indexOf(q) !== -1;
        card.style.display = hit ? '' : 'none';
        if (hit) visible++;
      });
      var countEl = document.getElementById('food-filter') && document.getElementById('foods-count');
      if (countEl) {
        if (q) { countEl.textContent = visible + ' hasil untuk pencarian ini.'; }
        else { countEl.textContent = cards.length + ' resep tersimpan di katalog.'; }
      }
    }

    async function importCatalogFoods() {
      var msgEl = document.getElementById('food-msg');
      var countEl = document.getElementById('foods-count');
      try {
        if (msgEl) msgEl.textContent = 'Menarik 8 resep katalog ke daftar kelola...';
        if (countEl) countEl.textContent = 'Menarik katalog...';
        const res = await fetch('/api/v1/recipes/import-catalog', { method: 'POST' });
        const json = await res.json();
        if (!res.ok) throw new Error((json && json.message) || ('Server jawab ' + res.status));
        if (msgEl) msgEl.textContent = json.message || 'Resep katalog berhasil ditarik.';
        loadFoods();
      } catch (e) {
        if (msgEl) msgEl.textContent = 'Gagal menarik katalog: ' + e.message;
        if (countEl) countEl.textContent = 'Gagal menarik katalog.';
      }
    }

    var FOOD_CAT_DEFAULT = 'WEIGHT_LOSS_LEAN_SCULPT';

    function ddOptions() {
      return Array.prototype.slice.call(document.querySelectorAll('#food-category-list li'));
    }

    function paintFoodCategory() {
      var hidden = document.getElementById('food-category');
      var label = document.getElementById('food-category-btn-label');
      if (!hidden || !label) return;
      var current = hidden.value || FOOD_CAT_DEFAULT;
      var found = null;
      ddOptions().forEach(function(li) {
        var isSel = li.getAttribute('data-value') === current;
        if (isSel) found = li;
        if (isSel) { li.classList.add('sel'); } else { li.classList.remove('sel'); }
        li.setAttribute('aria-selected', isSel ? 'true' : 'false');
      });
      if (found) {
        var text = found.querySelector('.dd-opt-label');
        label.textContent = text ? text.textContent : current;
      }
    }

    function setFoodCategory(v) {
      var hidden = document.getElementById('food-category');
      if (!hidden) return;
      var ok = ddOptions().some(function(li) { return li.getAttribute('data-value') === v; });
      hidden.value = ok ? v : FOOD_CAT_DEFAULT;
      paintFoodCategory();
      updateSkuPreview();
    }

    function isCategoryOpen() {
      var btn = document.getElementById('food-category-btn');
      return !!btn && btn.classList.contains('open');
    }

    function setCategoryOpen(open) {
      var btn = document.getElementById('food-category-btn');
      var menu = document.getElementById('food-category-list');
      if (!btn || !menu) return;
      if (open) { btn.classList.add('open'); } else { btn.classList.remove('open'); }
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { menu.removeAttribute('hidden'); } else { menu.setAttribute('hidden', ''); }
      if (open) syncCategoryHighlight();
    }

    function syncCategoryHighlight() {
      var hidden = document.getElementById('food-category');
      var current = hidden ? hidden.value : FOOD_CAT_DEFAULT;
      ddOptions().forEach(function(li) {
        if (li.getAttribute('data-value') === current) { li.classList.add('hl'); } else { li.classList.remove('hl'); }
      });
    }

    function moveCategoryHighlight(dir) {
      var opts = ddOptions();
      if (!opts.length) return;
      var idx = -1;
      opts.forEach(function(li, i) { if (li.classList.contains('hl')) idx = i; });
      var next = idx + dir;
      if (next < 0) next = 0;
      if (next >= opts.length) next = opts.length - 1;
      opts.forEach(function(li) { li.classList.remove('hl'); });
      opts[next].classList.add('hl');
      if (opts[next].scrollIntoView) opts[next].scrollIntoView({ block: 'nearest' });
    }

    function chooseHighlightedCategory() {
      var opts = ddOptions();
      for (var i = 0; i < opts.length; i++) {
        if (opts[i].classList.contains('hl')) {
          setFoodCategory(opts[i].getAttribute('data-value'));
          return true;
        }
      }
      return false;
    }

    document.addEventListener('click', function(e) {
      var dd = document.getElementById('food-category-dd');
      if (!dd || !isCategoryOpen()) return;
      if (!dd.contains(e.target)) setCategoryOpen(false);
    });

    (function initFoodCategory() {
      var btn = document.getElementById('food-category-btn');
      if (!btn) return;
      paintFoodCategory();
      btn.addEventListener('click', function() { setCategoryOpen(!isCategoryOpen()); });
      btn.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!isCategoryOpen()) { setCategoryOpen(true); return; }
          moveCategoryHighlight(e.key === 'ArrowDown' ? 1 : -1);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isCategoryOpen()) { setCategoryOpen(true); return; }
          chooseHighlightedCategory();
          setCategoryOpen(false);
          btn.focus();
        } else if (e.key === 'Escape' || e.key === 'Tab') {
          setCategoryOpen(false);
        }
      });
      ddOptions().forEach(function(li) {
        li.addEventListener('click', function() {
          setFoodCategory(li.getAttribute('data-value'));
          setCategoryOpen(false);
          btn.focus();
        });
        li.addEventListener('mouseenter', function() {
          ddOptions().forEach(function(o) { o.classList.remove('hl'); });
          li.classList.add('hl');
        });
      });
    })();

    function editFoodById(id) {
      const f = (window.__foods || []).find(x => x.id === id);
      if (!f) return;
      editFood(f);
    }

    function editFood(f) {
      document.getElementById('food-id').value = f.id;
      document.getElementById('food-title').value = f.title;
      setFoodCategory(f.category);
      document.getElementById('food-cal').value = f.calories;
      document.getElementById('food-pro').value = f.proteinGrams;
      document.getElementById('food-carb').value = f.carbsGrams;
      document.getElementById('food-fat').value = f.fatGrams;
      document.getElementById('food-qr').value = f.qrVerificationCode;
      document.getElementById('food-img').value = f.imageUrl || '';
      var preview = document.getElementById('food-preview');
      if (preview) {
        if (f.imageUrl) { preview.src = f.imageUrl; preview.style.display = ''; }
        else { preview.removeAttribute('src'); preview.style.display = 'none'; }
      }
      var fileInput = document.getElementById('food-file');
      if (fileInput) fileInput.value = '';
      document.getElementById('food-allergen').value = (f.allergens || []).join(', ');
      document.getElementById('food-active').checked = !!f.isActive;
      document.getElementById('food-msg').textContent = 'Mode ubah: ' + f.title + '. Periksa kembali lalu simpan ke katalog resep.';
      document.getElementById('food-sku-readout').textContent = 'SKU: ' + f.skuCode + ' (tetap, tidak berubah)';
      document.getElementById('food-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('food-title').focus();
    }

    async function toggleFoodActive(id, currentActive) {
      var msgEl = document.getElementById('food-msg');
      var toActive = String(currentActive) !== '1';
      try {
        if (msgEl) msgEl.textContent = toActive ? 'Mengaktifkan makanan ke katalog...' : 'Menonaktifkan makanan dari katalog...';
        const res = await fetch('/api/v1/recipes/' + id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: toActive }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error((json && json.message) || ('Server jawab ' + res.status));
        if (msgEl) msgEl.textContent = toActive ? 'Makanan aktif dan bisa dipesan pelanggan.' : 'Makanan dinonaktifkan dan disembunyikan dari pelanggan.';
        loadFoods();
      } catch (e) {
        if (msgEl) msgEl.textContent = 'Gagal ubah status: ' + e.message;
      }
    }

    async function deleteFood(id) {      if (!confirm('Hapus makanan ini dari katalog? Data yang terhapus tidak tampil di verifikasi QR pelanggan.')) return;
      document.getElementById('food-msg').textContent = 'Menghapus dari katalog...';
      const res = await fetch('/api/v1/recipes/' + id, { method: 'DELETE' });
      const json = await res.json();
      document.getElementById('food-msg').textContent = json.message || 'Makanan dihapus dari katalog.';
      loadFoods();
    }

    function resetFoodForm() {
      document.getElementById('food-form').reset();
      document.getElementById('food-id').value = '';
      document.getElementById('food-img').value = '';
      setFoodCategory(FOOD_CAT_DEFAULT);
      var preview = document.getElementById('food-preview');
      if (preview) { preview.removeAttribute('src'); preview.style.display = 'none'; }
      document.getElementById('food-msg').textContent = 'Formulir bersih. Siap tambah resep baru ke 60 rotasi resep.';
    }

    async function uploadFoodImage(input) {
      var msgEl = document.getElementById('food-msg');
      var preview = document.getElementById('food-preview');
      var hidden = document.getElementById('food-img');
      var file = input && input.files && input.files[0];
      if (!file) return;
      var allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowed.indexOf(file.type) === -1) {
        if (msgEl) msgEl.textContent = 'Format gambar harus JPG, PNG, atau WebP.';
        input.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        if (msgEl) msgEl.textContent = 'Ukuran gambar maksimal 2 MB. Kompres dahulu lalu unggah ulang.';
        input.value = '';
        return;
      }
      try {
        if (msgEl) msgEl.textContent = 'Mengunggah foto ke database...';
        var form = new FormData();
        form.append('image', file, file.name);
        const res = await fetch('/api/v1/recipes/upload-image', { method: 'POST', body: form });
        const json = await res.json();
        if (!res.ok) throw new Error((json && json.message) || ('Server jawab ' + res.status));
        if (hidden) hidden.value = (json.data && json.data.imageUrl) || '';
        if (preview && hidden && hidden.value) { preview.src = hidden.value; preview.style.display = ''; }
        if (msgEl) msgEl.textContent = json.message || 'Foto tersimpan di database.';
      } catch (e) {
        if (msgEl) msgEl.textContent = 'Gagal mengunggah foto: ' + e.message;
        input.value = '';
      }
    }

    async function submitFood(ev) {
      ev.preventDefault();
      var btn = document.getElementById('food-submit-btn');
      var msgEl = document.getElementById('food-msg');
      const id = document.getElementById('food-id').value;
      const payload = {
        title: document.getElementById('food-title').value.trim(),
        category: document.getElementById('food-category').value,
        calories: parseFloat(document.getElementById('food-cal').value),
        proteinGrams: parseFloat(document.getElementById('food-pro').value),
        carbsGrams: parseFloat(document.getElementById('food-carb').value),
        fatGrams: parseFloat(document.getElementById('food-fat').value),
        qrVerificationCode: document.getElementById('food-qr').value.trim(),
        imageUrl: document.getElementById('food-img').value.trim() || null,
        allergens: document.getElementById('food-allergen').value.split(',').map(s => s.trim()).filter(Boolean),
        isActive: document.getElementById('food-active').checked,
      };
      try {
        if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Menyimpan ke katalog...'; }
        msgEl.textContent = 'Menyimpan ke katalog resep...';
        const res = await fetch('/api/v1/recipes' + (id ? '/' + id : ''), {
          method: id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          msgEl.textContent = json.message || 'Gagal menyimpan. Periksa kode QR lalu coba lagi.';
          return false;
        }
        msgEl.textContent = json.message || 'Resep tersimpan di katalog.';
        resetFoodForm();
        loadFoods();
      } catch (e) {
        msgEl.textContent = 'Gagal menyimpan: ' + e.message;
      } finally {
        if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Simpan ke katalog resep'; }
      }
      return false;
    }

    var calWeekOffset = 0;
    var CAL_DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

    function calMonday(offset) {
      var now = new Date();
      var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var dow = monday.getDay();
      var delta = dow === 0 ? -6 : 1 - dow;
      monday.setDate(monday.getDate() + delta + (offset || 0) * 7);
      return monday;
    }

    function calKey(d) {
      var m = String(d.getMonth() + 1);
      if (m.length < 2) m = '0' + m;
      var day = String(d.getDate());
      if (day.length < 2) day = '0' + day;
      return d.getFullYear() + '-' + m + '-' + day;
    }

    function calCoversDay(f, key) {
      if (!f.isActive) return false;
      if (Array.isArray(f.availableDays) && f.availableDays.length > 0) {
        return f.availableDays.indexOf(key) !== -1;
      }
      var from = String(f.availableFrom || '').slice(0, 10);
      var until = String(f.availableUntil || '').slice(0, 10);
      if (from && from > key) return false;
      if (until && until < key) return false;
      return true;
    }

    function calWeekKeys() {
      var monday = calMonday(calWeekOffset);
      var keys = [];
      for (var i = 0; i < 5; i++) {
        var d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        keys.push(calKey(d));
      }
      return keys;
    }

    async function loadCalendar() {
      var grid = document.getElementById('cal-grid');
      var label = document.getElementById('cal-week-label');
      var summary = document.getElementById('cal-summary');
      var msgEl = document.getElementById('cal-msg');
      if (!grid) return;
      try {
        grid.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
        if (summary) summary.textContent = 'Memuat kalender...';
        const res = await fetch('/api/v1/recipes');
        const json = await res.json();
        window.__foods = json.data || [];
        renderCalendar();
      } catch (e) {
        if (summary) summary.textContent = 'Gagal memuat kalender.';
        grid.innerHTML = '<div class="empty-box" style="grid-column: 1 / -1;">Gagal memuat kalender: ' + escapeHtml(e.message) + '.</div>';
        if (msgEl) msgEl.textContent = 'Gagal memuat kalender: ' + e.message;
      }
    }

    var fxMiniYear = null;
    var fxMiniMonth = null;
    var fxSelectedKey = null;
    var FX_MINI_DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    var FX_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var FX_DOW_SHORT = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM'];

    function fxCatColor(category) {
      if (category === 'WEIGHT_LOSS_LEAN_SCULPT') return '#2C4A3E';
      if (category === 'MUSCLE_GAIN_FIT_BUILD') return '#D96B43';
      if (category === 'THERAPEUTIC_DIET') return '#4A7C9B';
      if (category === 'MAINTENANCE_VITALITY_DAILY') return '#B7791F';
      return '#6E665E';
    }

    function fxParseKey(key) {
      var p = String(key).split('-');
      return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    }

    function fxAgendaLabel(key, today) {
      if (key === today) return { main: 'HARI INI', sub: fmtDateId(key), today: true };
      var t = fxParseKey(today);
      var tomorrow = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
      var tomorrowKey = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');
      if (key === tomorrowKey) return { main: 'BESOK', sub: fmtDateId(key), today: false };
      var d = fxParseKey(key);
      var names = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
      return { main: names[d.getDay()], sub: fmtDateId(key), today: false };
    }

    function renderFxMini(rows, today) {
      var box = document.getElementById('fx-mini');
      var nameEl = document.getElementById('fx-month-name');
      var yearEl = document.getElementById('fx-month-year');
      if (!box) return;
      if (fxMiniYear == null) {
        var monday = calMonday(calWeekOffset);
        fxMiniYear = monday.getFullYear();
        fxMiniMonth = monday.getMonth();
      }
      if (nameEl) nameEl.textContent = FX_MONTHS[fxMiniMonth];
      if (yearEl) yearEl.textContent = String(fxMiniYear);
      var first = new Date(fxMiniYear, fxMiniMonth, 1);
      var lead = (first.getDay() + 6) % 7;
      var cells = [];
      for (var i = 0; i < 42; i++) {
        var d = new Date(fxMiniYear, fxMiniMonth, 1 - lead + i);
        var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var inMonth = d.getMonth() === fxMiniMonth;
        var dow = d.getDay();
        var isWeekend = dow === 0 || dow === 6;
        var dayFoods = rows.filter(function(r) { return calCoversDay(r, key); });
        var dots = dayFoods.slice(0, 3).map(function(f) {
          return '<i style="background:' + fxCatColor(f.category) + ';"></i>';
        }).join('');
        var cls = 'fx-mini-day' + (!inMonth || isWeekend ? ' is-dim' : '') + (isWeekend && inMonth ? ' is-weekend' : '') + (key === today ? ' is-today' : '') + (key === fxSelectedKey ? ' is-selected' : '');
        cells.push('<button type="button" class="' + cls + '" data-key="' + key + '" data-weekend="' + (isWeekend ? '1' : '0') + '" onclick="fxPickDay(this.dataset.key, this.dataset.weekend)"><span>' + d.getDate() + '</span><span class="fx-mini-dots">' + dots + '</span></button>');
      }
      box.innerHTML = FX_MINI_DOW.map(function(n) { return '<div class="fx-mini-dow">' + n + '</div>'; }).join('') + cells.join('');
    }

    function fxPickDay(key, isWeekend) {
      if (String(isWeekend) === '1') return;
      var monday = calMonday(calWeekOffset);
      var baseKey = monday.getFullYear() + '-' + String(monday.getMonth() + 1).padStart(2, '0') + '-' + String(monday.getDate()).padStart(2, '0');
      var diffDays = Math.round((fxParseKey(key).getTime() - fxParseKey(baseKey).getTime()) / 86400000);
      calWeekOffset += Math.floor(diffDays / 7);
      fxSelectedKey = key;
      renderCalendar();
    }

    function fxMiniNav(dir) {
      if (fxMiniYear == null) {
        var monday = calMonday(calWeekOffset);
        fxMiniYear = monday.getFullYear();
        fxMiniMonth = monday.getMonth();
      }
      var next = new Date(fxMiniYear, fxMiniMonth + dir, 1);
      fxMiniYear = next.getFullYear();
      fxMiniMonth = next.getMonth();
      renderFxMini(window.__foods || [], todayKeyLocal());
    }

    function renderFxAgenda(rows, today) {
      var box = document.getElementById('fx-agenda');
      if (!box) return;
      var start = fxSelectedKey && fxSelectedKey >= today ? fxSelectedKey : today;
      var groups = [];
      var cursor = fxParseKey(start);
      var guard = 0;
      while (groups.length < 6 && guard < 30) {
        guard++;
        var key = cursor.getFullYear() + '-' + String(cursor.getMonth() + 1).padStart(2, '0') + '-' + String(cursor.getDate()).padStart(2, '0');
        var dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) {
          var items = rows.filter(function(r) { return calCoversDay(r, key); });
          if (items.length) groups.push({ key: key, items: items });
        }
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
      }
      if (!groups.length) {
        box.innerHTML = '<div style="font-size:12px; color: rgba(253,251,247,0.6);">Belum ada jadwal tayang ke depan.</div>';
        return;
      }
      box.innerHTML = groups.map(function(g) {
        var label = fxAgendaLabel(g.key, today);
        var shown = g.items.slice(0, 6);
        var more = g.items.length - shown.length;
        return '<div class="fx-agenda-day">' +
          '<div class="fx-agenda-head' + (label.today ? ' today' : '') + '"><strong>' + label.main + '</strong><span>' + escapeHtml(label.sub) + '</span></div>' +
          shown.map(function(f) {
            return '<button type="button" class="fx-agenda-item" data-id="' + f.id + '" onclick="openCalEditor(this.dataset.id)"><i style="background:' + fxCatColor(f.category) + ';"></i><span>' + escapeHtml(f.title || '-') + '</span></button>';
          }).join('') +
          (more > 0 ? '<div class="fx-agenda-more">+' + more + ' lainnya</div>' : '') +
        '</div>';
      }).join('');
    }

    function fxFoodSearch(query) {
      var pop = document.getElementById('fx-search-pop');
      if (!pop) return;
      var q = String(query || '').toLowerCase().trim();
      if (!q) { pop.hidden = true; pop.innerHTML = ''; return; }
      var rows = window.__foods || [];
      var hits = rows.filter(function(f) {
        var hay = ((f.title || '') + ' ' + (f.skuCode || '') + ' ' + categoryLabel(f.category) + ' ' + (f.category || '') + ' ' + (f.qrVerificationCode || '')).toLowerCase();
        return hay.indexOf(q) !== -1;
      }).slice(0, 20);
      if (!hits.length) {
        pop.innerHTML = '<div class="fx-pop-empty">Tidak ada makanan cocok di database.</div>';
      } else {
        pop.innerHTML = hits.map(function(f) {
          return '<div class="fx-pop-item" draggable="true" data-id="' + f.id + '" ondragstart="fxDragStart(event)" onclick="openCalEditor(this.dataset.id)" title="Seret ke hari kalender atau klik untuk ubah">' +
            '<span class="fx-pop-title">' + escapeHtml(f.title || '-') + '</span>' +
            '<span class="fx-pop-meta">' + escapeHtml(f.skuCode || '-') + ' • ' + escapeHtml(categoryLabel(f.category)) + ' • ' + escapeHtml(foodWindowLabel(f)) + '</span>' +
          '</div>';
        }).join('');
      }
      pop.hidden = false;
    }

    function fxHidePop() {
      var pop = document.getElementById('fx-search-pop');
      if (pop) { pop.hidden = true; pop.innerHTML = ''; }
    }

    var fxDragOriginDay = null;

    function fxDragStart(ev) {
      var el = ev.currentTarget;
      if (!el) return;
      ev.dataTransfer.setData('text/plain', el.dataset.id || '');
      ev.dataTransfer.effectAllowed = 'copyMove';
      el.classList.add('dragging');
      var body = el.closest ? el.closest('.fx-col-body') : null;
      fxDragOriginDay = body && body.dataset.day ? body.dataset.day : null;
    }

    function fxEventKey(ev, id) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        openCalEditor(id);
      }
    }

    function fxDeleteFromDay(ev, foodId, dayKey) {
      if (ev) {
        ev.stopPropagation();
        ev.preventDefault();
      }
      fxRemoveFromSchedule(foodId, dayKey);
    }

    function fxClearDropTargets() {
      document.querySelectorAll('#cal-grid .drop-target').forEach(function(el) {
        el.classList.remove('drop-target');
      });
      var trash = document.getElementById('fx-trash');
      if (trash) trash.classList.remove('drop-target-trash');
      document.querySelectorAll('#fx-search-pop .dragging').forEach(function(el) {
        el.classList.remove('dragging');
      });
      document.querySelectorAll('#cal-grid .fx-event.dragging').forEach(function(el) {
        el.classList.remove('dragging');
      });
    }

    function fxEndDrag() {
      fxClearDropTargets();
      fxDragOriginDay = null;
    }

    // Sistem drop terdelegasi di level dokumen. Satu alur untuk kolom hari
    // dan bin sampah sehingga tidak bergantung pada listener per elemen.
    document.addEventListener('dragover', function(e) {
      var t = e.target && e.target.closest ? e.target.closest('#fx-trash, #cal-grid .fx-col-body') : null;
      if (!t) return;
      e.preventDefault();
      if (t.id === 'fx-trash') {
        e.dataTransfer.dropEffect = 'move';
        fxClearDropTargets();
        t.classList.add('drop-target-trash');
      } else {
        e.dataTransfer.dropEffect = 'copy';
        if (!t.classList.contains('drop-target')) {
          fxClearDropTargets();
          t.classList.add('drop-target');
        }
      }
    });

    document.addEventListener('drop', function(e) {
      var t = e.target && e.target.closest ? e.target.closest('#fx-trash, #cal-grid .fx-col-body') : null;
      if (!t) return;
      e.preventDefault();
      var foodId = '';
      try { foodId = e.dataTransfer.getData('text/plain'); } catch (err) { foodId = ''; }
      var isTrash = t.id === 'fx-trash';
      var dayKey = isTrash ? null : t.dataset.day;
      var originDay = fxDragOriginDay;
      fxEndDrag();
      if (!foodId) return;
      if (isTrash) { fxRemoveFromSchedule(foodId, originDay); return; }
      if (dayKey) fxAssignToDay(foodId, dayKey, originDay);
    });

    document.addEventListener('dragend', function() { fxEndDrag(); });
    document.addEventListener('dragleave', function(e) {
      if (!e.relatedTarget) fxClearDropTargets();
    });

    async function fxAssignToDay(foodId, dayKey, originDay) {
      var msgEl = document.getElementById('cal-msg');
      var f = (window.__foods || []).find(function(x) { return x.id === foodId; });
      if (!f) return;
      if (originDay && originDay === dayKey) {
        if (msgEl) msgEl.textContent = 'Tidak ada perubahan. Makanan tetap tayang pada ' + fmtDateId(dayKey) + '.';
        return;
      }
      var hadDays = Array.isArray(f.availableDays) && f.availableDays.length > 0;
      var days = hadDays
        ? f.availableDays.slice()
        : calWeekKeys().filter(function(k) {
            if (k === dayKey) return true;
            if (!f.isActive) return false;
            var from = String(f.availableFrom || '').slice(0, 10);
            var until = String(f.availableUntil || '').slice(0, 10);
            if (from && from > k) return false;
            if (until && until < k) return false;
            return true;
          });
      // Seret antar hari memindahkan jadwal, bukan menyalin. Makanan tanpa
      // hari eksplisit tetap ditambahkan seperti sebelumnya.
      var moved = false;
      if (originDay && originDay !== dayKey && hadDays) {
        days = days.filter(function(d) { return d !== originDay; });
        moved = true;
      }
      if (days.indexOf(dayKey) === -1) days.push(dayKey);
      days.sort();
      try {
        if (msgEl) msgEl.textContent = 'Menjadwalkan makanan ke ' + fmtDateId(dayKey) + '...';
        const res = await fetch('/api/v1/recipes/' + foodId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availableDays: days, availableFrom: null, availableUntil: null, isActive: true }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error((json && json.message) || ('Server jawab ' + res.status));
        if (msgEl) {
          msgEl.textContent = moved
            ? 'Makanan dipindah dari ' + fmtDateId(originDay) + ' ke ' + fmtDateId(dayKey) + '.'
            : 'Makanan tayang pada ' + fmtDateId(dayKey) + ' dan masuk kalender pelanggan.';
        }
        fxHidePop();
        loadCalendar();
        if (typeof loadFoods === 'function') loadFoods();
      } catch (e) {
        if (msgEl) msgEl.textContent = 'Gagal menjadwalkan: ' + e.message;
      }
    }

    async function fxRemoveFromSchedule(foodId, originDay) {
      var msgEl = document.getElementById('cal-msg');
      var f = (window.__foods || []).find(function(x) { return x.id === foodId; });
      if (!f) return;
      var days = Array.isArray(f.availableDays) && f.availableDays.length > 0 ? f.availableDays.slice() : null;
      if (originDay && days) {
        days = days.filter(function(d) { return d !== originDay; });
      }
      try {
        if (days) {
          if (msgEl) msgEl.textContent = 'Mengeluarkan makanan dari ' + fmtDateId(originDay) + '...';
          const res = await fetch('/api/v1/recipes/' + foodId, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availableDays: days, isActive: days.length > 0 ? f.isActive : false }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error((json && json.message) || ('Server jawab ' + res.status));
          if (msgEl) msgEl.textContent = days.length > 0
            ? 'Makanan dikeluarkan dari ' + fmtDateId(originDay) + ' saja. Hari lain tetap tayang.'
            : 'Makanan dikeluarkan dari semua jadwal.';
        } else if (originDay) {
          // Makanan selalu tayang tidak punya hari eksplisit. Keluarkan hanya
          // dari hari asal dengan mengubahnya jadi jadwal eksplisit minggu
          // tampil. Status aktif tidak diubah agar tidak hilang diam-diam.
          var weekDays = calWeekKeys().filter(function(k) { return k !== originDay; });
          if (msgEl) msgEl.textContent = 'Mengeluarkan makanan dari ' + fmtDateId(originDay) + '...';
          const res = await fetch('/api/v1/recipes/' + foodId, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availableDays: weekDays, availableFrom: null, availableUntil: null }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error((json && json.message) || ('Server jawab ' + res.status));
          if (msgEl) msgEl.textContent = 'Makanan dikeluarkan dari ' + fmtDateId(originDay) + ' saja. Hari lain tetap tayang.';
        } else {
          if (msgEl) msgEl.textContent = 'Makanan ini belum ada di jadwal hari mana pun.';
          return;
        }
        fxHidePop();
        loadCalendar();
        if (typeof loadFoods === 'function') loadFoods();
      } catch (e) {
        if (msgEl) msgEl.textContent = 'Gagal mengeluarkan: ' + e.message;
      }
    }

    document.addEventListener('click', function(e) {
      var pop = document.getElementById('fx-search-pop');
      var search = document.getElementById('fx-search');
      if (pop && !pop.hidden && !pop.contains(e.target) && e.target !== search) fxHidePop();
    });

    function fxFit() {
      var shell = document.querySelector('#tab-calendar.active .fx-shell');
      if (!shell) return;
      if (window.innerWidth <= 900) {
        shell.style.height = 'auto';
        shell.style.minHeight = 'auto';
        return;
      }
      var top = shell.getBoundingClientRect().top;
      var h = Math.max(560, window.innerHeight - top);
      shell.style.height = h + 'px';
      shell.style.minHeight = h + 'px';
    }

    window.addEventListener('resize', function() { fxFit(); });

    function renderCalendar() {
      var grid = document.getElementById('cal-grid');
      var label = document.getElementById('cal-week-label');
      var summary = document.getElementById('cal-summary');
      if (!grid) return;
      var rows = window.__foods || [];
      var keys = calWeekKeys();
      var today = todayKeyLocal();
      if (!fxSelectedKey) fxSelectedKey = today;
      if (label) label.textContent = fmtDateId(keys[0]) + ' sampai ' + fmtDateId(keys[4]);

      var activeNow = 0;
      rows.forEach(function(r) { if (foodWindowState(r) === 'on') activeNow++; });
      if (summary) summary.textContent = activeNow + ' aktif dari maks ' + ACTIVE_MEAL_CAP + ' • ' + rows.length + ' total resep.';

      renderFxMini(rows, today);
      renderFxAgenda(rows, today);

      grid.innerHTML = keys.map(function(key, idx) {
        var items = rows.filter(function(r) { return calCoversDay(r, key); });
        items.sort(function(a, b) { return (a.ingredientCostRp == null ? 999999999 : a.ingredientCostRp) - (b.ingredientCostRp == null ? 999999999 : b.ingredientCostRp); });
        var d = fxParseKey(key);
        var blocks = items.length ? items.map(function(f) {
          return '<div class="fx-event" role="button" tabindex="0" draggable="true" ondragstart="fxDragStart(event)" style="--fx-bar:' + fxCatColor(f.category) + ';" data-id="' + f.id + '" onclick="openCalEditor(this.dataset.id)" onkeydown="fxEventKey(event, this.dataset.id)" title="Seret ke hari lain atau klik untuk ubah">' +
            '<span class="fx-bar"></span>' +
            '<span class="fx-event-name">' + escapeHtml(f.title || '-') + '</span>' +
            '<button type="button" class="fx-del" data-id="' + f.id + '" data-day="' + key + '" onclick="fxDeleteFromDay(event, this.dataset.id, this.dataset.day)" title="Keluarkan dari hari ini" aria-label="Keluarkan dari hari ini">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
            '</button>' +
          '</div>';
        }).join('') : '<div class="fx-empty">Belum ada makanan tayang.</div>';
        return '<div class="fx-col' + (key === today ? ' is-today' : '') + '">' +
          '<div class="fx-col-head"><div class="fx-col-dow">' + FX_DOW_SHORT[idx] + '</div>' +
          '<div class="fx-col-num">' + d.getDate() + '</div>' +
          '<div class="fx-col-count">' + items.length + ' tayang</div></div>' +
          '<div class="fx-col-body" data-day="' + key + '">' + blocks +
          '<button type="button" class="fx-add" data-day="' + key + '" onclick="openCalAssign(this.dataset.day)">Tambah</button>' +
          '</div>' +
        '</div>';
      }).join('');
      var searchInput = document.getElementById('fx-search');
      var pop = document.getElementById('fx-search-pop');
      if (searchInput && pop && !pop.hidden && searchInput.value) fxFoodSearch(searchInput.value);
      fxFit();
    }

    function calNav(dir) {
      calWeekOffset += dir;
      var monday = calMonday(calWeekOffset);
      fxMiniYear = monday.getFullYear();
      fxMiniMonth = monday.getMonth();
      if ((window.__foods || []).length) { renderCalendar(); return; }
      loadCalendar();
    }

    function calToday() {
      calWeekOffset = 0;
      fxSelectedKey = todayKeyLocal();
      var monday = calMonday(0);
      fxMiniYear = monday.getFullYear();
      fxMiniMonth = monday.getMonth();
      if ((window.__foods || []).length) { renderCalendar(); return; }
      loadCalendar();
    }

    function openCalModal() {
      var modal = document.getElementById('cal-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeCalEditor() {
      var modal = document.getElementById('cal-modal');
      if (modal) modal.style.display = 'none';
      var msg = document.getElementById('cal-modal-msg');
      if (msg) msg.textContent = '';
    }

    document.addEventListener('click', function(e) {
      var modal = document.getElementById('cal-modal');
      if (modal && modal.style.display === 'flex' && e.target === modal) closeCalEditor();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { closeCalEditor(); if (typeof fxHidePop === 'function') fxHidePop(); }
    });

    var calOrigFrom = '';
    var calOrigTo = '';
    var calHadDays = false;

    function openCalEditor(id) {
      var f = (window.__foods || []).find(function(x) { return x.id === id; });
      if (!f) return;
      document.getElementById('cal-modal-id').value = f.id;
      document.getElementById('cal-modal-title').textContent = f.title || '-';
      document.getElementById('cal-modal-sub').textContent = (f.skuCode || '-') + ' • ' + foodWindowLabel(f);
      var wrap = document.getElementById('cal-modal-food-wrap');
      if (wrap) wrap.style.display = 'none';
      calOrigFrom = String(f.availableFrom || '').slice(0, 10);
      calOrigTo = String(f.availableUntil || '').slice(0, 10);
      calHadDays = Array.isArray(f.availableDays) && f.availableDays.length > 0;
      document.getElementById('cal-modal-from').value = calOrigFrom;
      document.getElementById('cal-modal-to').value = calOrigTo;
      document.getElementById('cal-modal-cost').value = f.ingredientCostRp == null ? '' : f.ingredientCostRp;
      document.getElementById('cal-modal-active').checked = !!f.isActive;
      openCalModal();
    }

    function openCalAssign(dayKey) {
      var rows = window.__foods || [];
      var candidates = rows.filter(function(r) { return !calCoversDay(r, dayKey); });
      var select = document.getElementById('cal-modal-food');
      if (select) {
        select.innerHTML = candidates.length ? candidates.map(function(f) {
          return '<option value="' + f.id + '">' + escapeHtml((f.title || '-') + ' (' + (f.skuCode || '-') + ')') + '</option>';
        }).join('') : '<option value="">Semua makanan sudah tayang hari ini</option>';
      }
      document.getElementById('cal-modal-id').value = '';
      document.getElementById('cal-modal-title').textContent = 'Tambah ke ' + fmtDateId(dayKey);
      document.getElementById('cal-modal-sub').textContent = 'Pilih makanan lalu simpan untuk menayangkan pada hari itu saja.';
      var wrap = document.getElementById('cal-modal-food-wrap');
      if (wrap) wrap.style.display = '';
      calOrigFrom = dayKey;
      calOrigTo = dayKey;
      calHadDays = false;
      document.getElementById('cal-modal-from').value = dayKey;
      document.getElementById('cal-modal-to').value = dayKey;
      document.getElementById('cal-modal-cost').value = '';
      document.getElementById('cal-modal-active').checked = true;
      openCalModal();
    }

    async function saveCalEditor() {
      var msgEl = document.getElementById('cal-modal-msg');
      var id = document.getElementById('cal-modal-id').value;
      var select = document.getElementById('cal-modal-food');
      if (!id && select) id = select.value;
      if (!id) {
        if (msgEl) msgEl.textContent = 'Pilih makanan dahulu.';
        return;
      }
      var costRaw = document.getElementById('cal-modal-cost').value;
      var newFrom = document.getElementById('cal-modal-from').value || null;
      var newTo = document.getElementById('cal-modal-to').value || null;
      var datesChanged = (newFrom || '') !== calOrigFrom || (newTo || '') !== calOrigTo;
      var payload = {
        availableFrom: newFrom,
        availableUntil: newTo,
        ingredientCostRp: costRaw === '' ? null : parseFloat(costRaw),
        isActive: document.getElementById('cal-modal-active').checked,
      };
      if (!calHadDays || datesChanged) {
        payload.availableDays = null;
      }
      try {
        if (msgEl) msgEl.textContent = 'Menyimpan jadwal tayang...';
        const res = await fetch('/api/v1/recipes/' + id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error((json && json.message) || ('Server jawab ' + res.status));
        closeCalEditor();
        var calMsg = document.getElementById('cal-msg');
        if (calMsg) calMsg.textContent = 'Jadwal tayang tersimpan dan masuk kalender pelanggan.';
        loadCalendar();
        if (typeof loadFoods === 'function') loadFoods();
      } catch (e) {
        if (msgEl) msgEl.textContent = 'Gagal menyimpan jadwal: ' + e.message;
      }
    }

        var trFoodId = '';

    async function loadTransparency() {
      var countEl = document.getElementById('tr-count');
      var msgEl = document.getElementById('tr-msg');
      try {
        if (countEl) countEl.textContent = 'Memuat...';
        const res = await fetch('/api/v1/recipes');
        const json = await res.json();
        window.__foods = json.data || [];
        var rows = window.__foods;
        if (countEl) countEl.textContent = rows.length + ' makanan di database.';
        if (!trFoodId || !rows.some(function(r) { return r.id === trFoodId; })) {
          trFoodId = rows.length ? rows[0].id : '';
        }
        renderTrFoodList(rows);
        paintTrFood();
        renderTrForm(trFoodId);
      } catch (e) {
        if (msgEl) msgEl.textContent = 'Gagal memuat makanan: ' + e.message;
        renderTrFoodList([]);
        paintTrFood();
      }
    }

    function trFoodItems() {
      return Array.prototype.slice.call(document.querySelectorAll('#tr-food-options li'));
    }

    function trVisibleItems() {
      return trFoodItems().filter(function(li) { return li.style.display !== 'none'; });
    }

    function trFoodOptionHtml(f) {
      var sel = f.id === trFoodId;
      var hay = ((f.title || '') + ' ' + (f.skuCode || '') + ' ' + categoryLabel(f.category) + ' ' + (f.category || '')).toLowerCase();
      return '<li role="option" aria-selected="' + (sel ? 'true' : 'false') + '" data-id="' + f.id + '" data-search="' + escapeHtml(hay) + '" tabindex="-1" class="' + (sel ? 'sel' : '') + '">' +
        '<span class="dd-opt-dot" style="background:' + fxCatColor(f.category) + ';"></span>' +
        '<span class="dd-opt-main"><span class="dd-opt-label">' + escapeHtml(f.title || '-') + '</span>' +
        '<span class="dd-opt-desc">' + escapeHtml((f.skuCode || '-') + ' • ' + categoryLabel(f.category) + ' • ' + (f.calories != null ? f.calories + ' kkal' : '-')) + '</span></span>' +
        '<svg class="dd-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
      '</li>';
    }

    function renderTrFoodList(rows) {
      var box = document.getElementById('tr-food-options');
      var empty = document.getElementById('tr-food-empty');
      if (!box) return;
      box.innerHTML = (rows || []).map(trFoodOptionHtml).join('');
      trFoodItems().forEach(function(li) {
        li.addEventListener('click', function() { setTrFood(li.getAttribute('data-id')); });
        li.addEventListener('mouseenter', function() {
          trFoodItems().forEach(function(o) { o.classList.remove('hl'); });
          li.classList.add('hl');
        });
      });
      if (empty) empty.hidden = (rows || []).length > 0;
    }

    function paintTrFood() {
      var label = document.getElementById('tr-food-btn-label');
      if (!label) return;
      var f = (window.__foods || []).find(function(x) { return x.id === trFoodId; });
      label.textContent = f ? (f.title || '-') + ' (' + (f.skuCode || '-') + ')' : 'Belum ada makanan di database';
      trFoodItems().forEach(function(li) {
        var isSel = li.getAttribute('data-id') === trFoodId;
        if (isSel) { li.classList.add('sel'); } else { li.classList.remove('sel'); }
        li.setAttribute('aria-selected', isSel ? 'true' : 'false');
      });
    }

    function setTrFood(id) {
      if (!id) return;
      trFoodId = id;
      paintTrFood();
      setTrFoodOpen(false);
      var btn = document.getElementById('tr-food-btn');
      if (btn) btn.focus();
      renderTrForm(trFoodId);
    }

    function isTrFoodOpen() {
      var btn = document.getElementById('tr-food-btn');
      return !!btn && btn.classList.contains('open');
    }

    function setTrFoodOpen(open) {
      var btn = document.getElementById('tr-food-btn');
      var menu = document.getElementById('tr-food-list');
      var filter = document.getElementById('tr-food-filter');
      if (!btn || !menu) return;
      if (open) { btn.classList.add('open'); } else { btn.classList.remove('open'); }
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { menu.removeAttribute('hidden'); } else { menu.setAttribute('hidden', ''); }
      if (open) {
        if (filter) { filter.value = ''; filterTrFoods(''); }
        trSyncHl();
        if (filter) filter.focus();
      }
    }

    function trSyncHl() {
      var items = trVisibleItems();
      trFoodItems().forEach(function(li) { li.classList.remove('hl'); });
      var idx = -1;
      items.forEach(function(li, i) { if (li.getAttribute('data-id') === trFoodId) idx = i; });
      if (idx === -1 && items.length) idx = 0;
      if (idx !== -1) {
        items[idx].classList.add('hl');
        if (items[idx].scrollIntoView) items[idx].scrollIntoView({ block: 'nearest' });
      }
    }

    function trMoveHl(dir) {
      var items = trVisibleItems();
      if (!items.length) return;
      var idx = -1;
      items.forEach(function(li, i) { if (li.classList.contains('hl')) idx = i; });
      var next = idx + dir;
      if (next < 0) next = 0;
      if (next >= items.length) next = items.length - 1;
      trFoodItems().forEach(function(li) { li.classList.remove('hl'); });
      items[next].classList.add('hl');
      if (items[next].scrollIntoView) items[next].scrollIntoView({ block: 'nearest' });
    }

    function trChooseHl() {
      var items = trVisibleItems();
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('hl')) {
          setTrFood(items[i].getAttribute('data-id'));
          return true;
        }
      }
      if (items.length) { setTrFood(items[0].getAttribute('data-id')); return true; }
      return false;
    }

    function filterTrFoods(q) {
      var query = String(q || '').toLowerCase().trim();
      var visible = 0;
      trFoodItems().forEach(function(li) {
        var hit = !query || (li.getAttribute('data-search') || '').indexOf(query) !== -1;
        li.style.display = hit ? '' : 'none';
        if (hit) visible++;
      });
      var empty = document.getElementById('tr-food-empty');
      var hasRows = (window.__foods || []).length > 0;
      if (empty) {
        if (!hasRows) { empty.hidden = false; empty.textContent = 'Belum ada makanan di database. Tambah dahulu di Kelola makanan.'; }
        else if (!visible) { empty.hidden = false; empty.textContent = 'Tidak ada makanan cocok dengan pencarian.'; }
        else { empty.hidden = true; }
      }
      trSyncHl();
    }

    (function initTrFoodDd() {
      var btn = document.getElementById('tr-food-btn');
      var filter = document.getElementById('tr-food-filter');
      if (!btn) return;
      btn.addEventListener('click', function() { setTrFoodOpen(!isTrFoodOpen()); });
      btn.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!isTrFoodOpen()) { setTrFoodOpen(true); return; }
          trMoveHl(e.key === 'ArrowDown' ? 1 : -1);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isTrFoodOpen()) { setTrFoodOpen(true); return; }
          trChooseHl();
        } else if (e.key === 'Escape') {
          setTrFoodOpen(false);
        }
      });
      if (filter) {
        filter.addEventListener('input', function() { filterTrFoods(filter.value); });
        filter.addEventListener('keydown', function(e) {
          if (e.key === 'ArrowDown') { e.preventDefault(); trMoveHl(1); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); trMoveHl(-1); }
          else if (e.key === 'Enter') { e.preventDefault(); trChooseHl(); }
          else if (e.key === 'Escape') { e.preventDefault(); setTrFoodOpen(false); btn.focus(); }
        });
        filter.addEventListener('click', function(e) { e.stopPropagation(); });
      }
    })();

    document.addEventListener('click', function(e) {
      var dd = document.getElementById('tr-food-dd');
      if (!dd || !isTrFoodOpen()) return;
      if (!dd.contains(e.target)) setTrFoodOpen(false);
    });

    function trInput(id, label, value, type) {
      return '<label class="field"><span class="field-label">' + label + '</span>' +
        '<input class="input" id="' + id + '" type="' + (type || 'text') + '" value="' + escapeHtml(value == null ? '' : String(value)) + '" /></label>';
    }

    function trGrammageRow(g) {
      g = g || {};
      return '<div class="tr-row" data-kind="grammage" style="display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr) auto; gap:8px; align-items:end;">' +
        '<label class="field"><span class="field-label">Bahan</span><input class="input tr-g-label" value="' + escapeHtml(g.label || '') + '" placeholder="Fillet salmon" /></label>' +
        '<label class="field"><span class="field-label">Takaran</span><input class="input tr-g-weight" value="' + escapeHtml(g.weight || '') + '" placeholder="180 gram" /></label>' +
        '<button class="btn-ghost" type="button" onclick="trDelRow(this)">Hapus</button>' +
      '</div>';
    }

    function trFarmRow(f) {
      f = f || {};
      var certs = Array.isArray(f.certifications) ? f.certifications.join(', ') : (f.certifications || '');
      return '<div class="tr-row" data-kind="farm" style="display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap:8px; align-items:end; border:1px solid var(--border-warm); border-radius:8px; padding:10px;">' +
        '<label class="field"><span class="field-label">Nama bahan atau petani</span><input class="input tr-f-name" value="' + escapeHtml(f.name || '') + '" /></label>' +
        '<label class="field"><span class="field-label">Lokasi asal</span><input class="input tr-f-location" value="' + escapeHtml(f.location || f.origin || '') + '" /></label>' +
        '<label class="field"><span class="field-label">Waktu panen</span><input class="input tr-f-harvest" value="' + escapeHtml(f.harvestDate || f.harvestMethod || '') + '" /></label>' +
        '<label class="field"><span class="field-label">Sertifikasi (pisah koma)</span><input class="input tr-f-certs" value="' + escapeHtml(certs) + '" /></label>' +
        '<button class="btn-ghost" type="button" onclick="trDelRow(this)" style="grid-column: 1 / -1; justify-self:start;">Hapus bahan ini</button>' +
      '</div>';
    }

    function renderTrForm(id) {
      trFoodId = id || '';
      var box = document.getElementById('tr-form');
      if (!box) return;
      var f = (window.__foods || []).find(function(x) { return x.id === trFoodId; });
      if (!f) {
        box.innerHTML = '<div class="empty-box">Belum ada makanan di database. Tambah dahulu di Kelola makanan.</div>';
        return;
      }
      var d = f.details && typeof f.details === 'object' ? f.details : {};
      var lab = d.lab && typeof d.lab === 'object' ? d.lab : {};
      box.innerHTML =
        '<div class="food-form-card" style="margin-bottom:16px;">' +
          '<p class="eyebrow">Identitas tiket</p>' +
          '<h3 style="font-size:16px; font-weight:700; margin-top:4px;">' + escapeHtml(f.title || '-') + '</h3>' +
          '<div class="food-field-grid">' +
            trInput('tr-batch', 'Kode batch', d.batchCode) +
            trInput('tr-ticket', 'Nomor tiket', d.ticketNumber) +
            trInput('tr-short', 'Judul singkat', d.shortTitle) +
            trInput('tr-caption', 'Keterangan foto', d.imageCaption) +
            trInput('tr-packaging', 'Waktu pengemasan', d.packagingTimestamp) +
            trInput('tr-chef', 'Catatan koki', d.chefNotes) +
            trInput('tr-portion', 'Berat porsi (gram)', d.portionWeightGrams, 'number') +
            trInput('tr-tolerance', 'Toleransi (gram)', d.toleranceGrams, 'number') +
            trInput('tr-fiber', 'Serat (gram)', d.fiberGrams, 'number') +
            trInput('tr-sodium', 'Natrium (mg)', d.sodiumMg, 'number') +
            trInput('tr-gi', 'Indeks glikemik', d.glycemicIndex, 'number') +
          '</div>' +
        '</div>' +
        '<div class="food-form-card" style="margin-bottom:16px;">' +
          '<p class="eyebrow">Rincian gramatur penimbangan</p>' +
          '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px;">' +
            '<h3 style="font-size:16px; font-weight:700;">Gramatur per bahan</h3>' +
            '<button class="btn-ghost" type="button" onclick="trAddGrammage()">Tambah baris</button>' +
          '</div>' +
          '<div id="tr-grammage" style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">' +
            ((d.grammage || []).map(trGrammageRow).join('') || trGrammageRow(null)) +
          '</div>' +
        '</div>' +
        '<div class="food-form-card" style="margin-bottom:16px;">' +
          '<p class="eyebrow">Asal usul bahan dari petani mitra</p>' +
          '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px;">' +
            '<h3 style="font-size:16px; font-weight:700;">Petani mitra</h3>' +
            '<button class="btn-ghost" type="button" onclick="trAddFarm()">Tambah bahan</button>' +
          '</div>' +
          '<div id="tr-farms" style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">' +
            ((d.farms || []).map(trFarmRow).join('') || trFarmRow(null)) +
          '</div>' +
        '</div>' +
        '<div class="food-form-card" style="margin-bottom:16px;">' +
          '<p class="eyebrow">Uji laboratorium independen</p>' +
          '<h3 style="font-size:16px; font-weight:700; margin-top:4px;">Sertifikasi lab</h3>' +
          '<div class="food-field-grid">' +
            trInput('tr-lab-name', 'Laboratorium', lab.laboratory) +
            trInput('tr-lab-cert', 'Nomor sertifikat', lab.certificateNumber) +
            trInput('tr-lab-date', 'Tanggal uji', lab.testDate) +
            trInput('tr-lab-status', 'Status', lab.status) +
            trInput('tr-lab-micro', 'Mikrobiologi', lab.microbiology) +
            trInput('tr-lab-accuracy', 'Akurasi', lab.accuracyRating) +
          '</div>' +
        '</div>' +
        '<div style="display:flex; flex-wrap:wrap; gap:8px;">' +
          '<button class="btn-primary" type="button" onclick="saveTransparency()"><span>Simpan data transparansi</span></button>' +
        '</div>';
    }

    function trAddGrammage() {
      var box = document.getElementById('tr-grammage');
      if (!box) return;
      box.insertAdjacentHTML('beforeend', trGrammageRow(null));
    }

    function trAddFarm() {
      var box = document.getElementById('tr-farms');
      if (!box) return;
      box.insertAdjacentHTML('beforeend', trFarmRow(null));
    }

    function trDelRow(btn) {
      var row = btn.closest ? btn.closest('.tr-row') : null;
      if (row) row.remove();
    }

    function trNum(id) {
      var el = document.getElementById(id);
      if (!el || el.value === '') return undefined;
      var n = parseFloat(el.value);
      return Number.isFinite(n) ? n : undefined;
    }

    function trVal(id) {
      var el = document.getElementById(id);
      var v = el ? el.value.trim() : '';
      return v || undefined;
    }

    async function saveTransparency() {
      var msgEl = document.getElementById('tr-msg');
      if (!trFoodId) {
        if (msgEl) msgEl.textContent = 'Pilih makanan dahulu.';
        return;
      }
      var grammage = Array.prototype.map.call(
        document.querySelectorAll('#tr-grammage .tr-row'),
        function(row) {
          var label = row.querySelector('.tr-g-label');
          var weight = row.querySelector('.tr-g-weight');
          return { label: label ? label.value.trim() : '', weight: weight ? weight.value.trim() : '' };
        }
      ).filter(function(g) { return g.label || g.weight; });
      var farms = Array.prototype.map.call(
        document.querySelectorAll('#tr-farms .tr-row'),
        function(row) {
          var get = function(sel) {
            var el = row.querySelector(sel);
            return el ? el.value.trim() : '';
          };
          return {
            name: get('.tr-f-name'),
            location: get('.tr-f-location'),
            harvestDate: get('.tr-f-harvest'),
            certifications: get('.tr-f-certs').split(',').map(function(s) { return s.trim(); }).filter(Boolean),
          };
        }
      ).filter(function(f) { return f.name || f.location; });
      var details = {
        batchCode: trVal('tr-batch'),
        ticketNumber: trVal('tr-ticket'),
        shortTitle: trVal('tr-short'),
        imageCaption: trVal('tr-caption'),
        packagingTimestamp: trVal('tr-packaging'),
        chefNotes: trVal('tr-chef'),
        portionWeightGrams: trNum('tr-portion'),
        toleranceGrams: trNum('tr-tolerance'),
        fiberGrams: trNum('tr-fiber'),
        sodiumMg: trNum('tr-sodium'),
        glycemicIndex: trNum('tr-gi'),
        grammage: grammage,
        farms: farms,
        lab: {
          laboratory: trVal('tr-lab-name'),
          certificateNumber: trVal('tr-lab-cert'),
          testDate: trVal('tr-lab-date'),
          status: trVal('tr-lab-status'),
          microbiology: trVal('tr-lab-micro'),
          accuracyRating: trVal('tr-lab-accuracy'),
        },
      };
      try {
        if (msgEl) msgEl.textContent = 'Menyimpan data transparansi...';
        const res = await fetch('/api/v1/recipes/' + trFoodId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ details: details }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error((json && json.message) || ('Server jawab ' + res.status));
        if (msgEl) msgEl.textContent = 'Data transparansi tersimpan di database dan tampil di halaman pelanggan.';
        loadTransparency();
      } catch (e) {
        if (msgEl) msgEl.textContent = 'Gagal menyimpan: ' + e.message;
      }
    }

    function filterCrmTable(query) {
      var q = String(query || '').toLowerCase().trim();
      var rows = document.querySelectorAll('#crm-body tr');
      Array.prototype.forEach.call(rows, function(r) {
        var text = String(r.textContent || '').toLowerCase();
        r.style.display = !q || text.indexOf(q) !== -1 ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}
