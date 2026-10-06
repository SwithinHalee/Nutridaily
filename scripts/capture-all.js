const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../presentation_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Meluncurkan Chrome headless untuk capture UI...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Home Hero
  console.log('1. Mengambil Home Hero...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_home_hero.png') });

  // 2. TDEE Calculator
  console.log('2. Mengambil TDEE Calculator...');
  const calcEl = await page.$('#calculator');
  if (calcEl) {
    await calcEl.scrollIntoView();
    await new Promise((r) => setTimeout(r, 600));
    await calcEl.screenshot({ path: path.join(OUTPUT_DIR, '02_tdee_calculator.png') });
  }

  // 3. Weekly Menu Catalog
  console.log('3. Mengambil Menu Swapper / Katalog...');
  const menuEl = await page.$('#menu-catalog');
  if (menuEl) {
    await menuEl.scrollIntoView();
    await new Promise((r) => setTimeout(r, 600));
    await menuEl.screenshot({ path: path.join(OUTPUT_DIR, '03_menu_catalog.png') });
  }

  // 4. Clean Label Section
  console.log('4. Mengambil Clean Label Card...');
  const cleanEl = await page.$('section[aria-labelledby="clean-label-heading"]') || await page.$('.border-warm-border');
  // Scroll down more to find clean label
  await page.evaluate(() => window.scrollBy(0, 1800));
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_clean_label_card.png') });

  // 5. Verify QR Clean Label Page
  console.log('5. Mengambil Verify QR Page...');
  await page.goto('http://localhost:3000/verify/ND-VERIFY-SALMON-2026', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_verify_page.png') });

  // 6. Checkout Page
  console.log('6. Mengambil Checkout Page...');
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_checkout_page.png') });

  // 7. Login Page
  console.log('7. Mengambil Login Page...');
  await page.goto('http://localhost:3000/account/login', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_login_page.png') });

  // 8. Mobile Viewport Views
  console.log('8. Mengambil Mobile Views...');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_mobile_home.png') });

  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_mobile_checkout.png') });

  await page.goto('http://localhost:3000/verify/ND-VERIFY-SALMON-2026', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_mobile_verify.png') });

  await browser.close();
  console.log('Selesai mengambil seluruh screenshot resolusi tinggi!');
}

capture().catch((err) => {
  console.error('Error saat capture:', err);
  process.exit(1);
});
