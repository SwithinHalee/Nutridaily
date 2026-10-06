import subprocess
import os
import time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ASSETS_DIR = r"D:\Projects\Nutridaily\presentation_assets"

os.makedirs(ASSETS_DIR, exist_ok=True)

targets = [
    {
        "name": "01_home_hero.png",
        "url": "http://localhost:3000",
        "size": "1440,900",
        "mobile": False
    },
    {
        "name": "02_dashboard_overview.png",
        "url": "http://localhost:3000/dashboard",
        "size": "1440,900",
        "mobile": False
    },
    {
        "name": "03_account_profile.png",
        "url": "http://localhost:3000/account",
        "size": "1440,900",
        "mobile": False
    },
    {
        "name": "04_verify_clean_label.png",
        "url": "http://localhost:3000/verify/ND-VERIFY-SALMON-2026",
        "size": "1440,900",
        "mobile": False
    },
    {
        "name": "05_checkout_flow.png",
        "url": "http://localhost:3000/checkout",
        "size": "1440,900",
        "mobile": False
    },
    {
        "name": "06_login_auth.png",
        "url": "http://localhost:3000/account/login",
        "size": "1440,900",
        "mobile": False
    },
    {
        "name": "07_home_mobile.png",
        "url": "http://localhost:3000",
        "size": "390,844",
        "mobile": True
    },
    {
        "name": "08_dashboard_mobile.png",
        "url": "http://localhost:3000/dashboard",
        "size": "390,844",
        "mobile": True
    },
    {
        "name": "09_verify_mobile.png",
        "url": "http://localhost:3000/verify/ND-VERIFY-SALMON-2026",
        "size": "390,844",
        "mobile": True
    }
]

for t in targets:
    out_path = os.path.join(ASSETS_DIR, t["name"])
    print(f"Mengambil screenshot: {t['name']} dari {t['url']} ({t['size']})...")
    
    args = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--window-size={t['size']}",
        "--hide-scrollbars",
        f"--screenshot={out_path}",
        t["url"]
    ]
    
    res = subprocess.run(args, capture_output=True)
    if os.path.exists(out_path):
        size_kb = os.path.getsize(out_path) / 1024
        print(f"Berhasil: {t['name']} ({size_kb:.1f} KB)")
    else:
        print(f"Gagal mengambil: {t['name']}")

print("Selesai mengambil seluruh screenshot frontend.")
