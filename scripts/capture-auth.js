const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../presentation_assets');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigasi ke login...');
  await page.goto('http://localhost:3000/account/login', { waitUntil: 'networkidle2' });

  console.log('Mengisi formulir login demo...');
  await page.type('input[type="email"]', 'demo@nutridaily.id');
  await page.type('input[type="password"]', 'Katering#Sehat2026');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Mengambil screenshot dashboard aktif...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_dashboard_active.png') });

  console.log('Mengambil screenshot profil & rekam medis akun...');
  await page.goto('http://localhost:3000/account', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_account_active.png') });

  await browser.close();
  console.log('Sukses mengambil dashboard aktif & profil akun!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
