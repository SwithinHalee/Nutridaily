import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# 1. Palet Warna NutriDaily (Berdasarkan style.md)
COLOR_BG_LIGHT = RGBColor(253, 251, 247)     # #FDFBF7 (Off-white tebu)
COLOR_TEXT_DARK = RGBColor(26, 19, 16)       # #1A1310 (Warm near-black)
COLOR_TEXT_MUTED = RGBColor(107, 94, 85)     # #6B5E55 (Warm muted)
COLOR_FOREST = RGBColor(44, 74, 62)          # #2C4A3E (Forest avocado)
COLOR_FOREST_DARK = RGBColor(31, 53, 44)     # Dark Forest
COLOR_TERRACOTTA = RGBColor(217, 107, 67)    # #D96B43 (Warm terracotta)
COLOR_CARD_BG = RGBColor(245, 241, 232)      # #F5F1E8 (Light card surface)
COLOR_CARD_BORDER = RGBColor(226, 221, 213)  # #E2DDD5 (Border)
COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_DARK_PANEL = RGBColor(36, 28, 24)      # #241C18 (Dark surface)

FONT_DISPLAY = "Fraunces"
FONT_BODY = "Manrope"

ASSETS_DIR = r"D:\Projects\Nutridaily\presentation_assets"
OUTPUT_PPTX = r"D:\Projects\Nutridaily\NutriDaily_Frontend_Presentation.pptx"

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def add_header(slide, number_str, category_str, title_str, subtitle_str=None, dark=False):
        # Category Badge
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(8), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = f"{category_str.upper()}  •  SLIDE {number_str}"
        p_cat.font.name = FONT_BODY
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_TERRACOTTA if not dark else RGBColor(230, 140, 100)

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.5), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_str
        p_title.font.name = FONT_DISPLAY
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_DARK if not dark else COLOR_WHITE

        # Subtitle
        if subtitle_str:
            p_sub = tf_title.add_paragraph()
            p_sub.text = subtitle_str
            p_sub.font.name = FONT_BODY
            p_sub.font.size = Pt(12)
            p_sub.font.color.rgb = COLOR_TEXT_MUTED if not dark else RGBColor(200, 195, 190)

    def set_bg(slide, color):
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = color
        bg_shape.line.color.rgb = color
        return bg_shape

    # ==========================================
    # SLIDE 1: Title Slide (Cover)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1, COLOR_FOREST)

    # Decorative Card Left
    t1_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(6.5), Inches(4.5))
    tf1 = t1_box.text_frame
    tf1.word_wrap = True

    p_badge = tf1.paragraphs[0]
    p_badge.text = "NUTRIDAILY INDONESIA  •  FRONTEND WEB & PWA"
    p_badge.font.name = FONT_BODY
    p_badge.font.size = Pt(11)
    p_badge.font.bold = True
    p_badge.font.color.rgb = RGBColor(230, 160, 120)

    p_h1 = tf1.add_paragraph()
    p_h1.text = "Platform D2C Food-Tech Katering Sehat Digital"
    p_h1.font.name = FONT_DISPLAY
    p_h1.font.size = Pt(36)
    p_h1.font.bold = True
    p_h1.font.color.rgb = COLOR_WHITE
    p_h1.space_before = Pt(12)
    p_h1.space_after = Pt(16)

    p_desc = tf1.add_paragraph()
    p_desc.text = "Eksplorasi antarmuka pelanggan publik: dari kalkulasi metabolisme tubuh Mifflin-St Jeor, fleksibilitas langganan harian, hingga transparansi bahan baku berlabel bersih."
    p_desc.font.name = FONT_BODY
    p_desc.font.size = Pt(13)
    p_desc.font.color.rgb = RGBColor(220, 230, 225)
    p_desc.space_after = Pt(24)

    p_meta = tf1.add_paragraph()
    p_meta.text = "Next.js 14 App Router  •  Tailwind CSS  •  UU PDP No. 27/2022  •  Port 3000"
    p_meta.font.name = FONT_BODY
    p_meta.font.size = Pt(11)
    p_meta.font.bold = True
    p_meta.font.color.rgb = RGBColor(230, 160, 120)

    # Hero UI Preview Right
    img1_path = os.path.join(ASSETS_DIR, "01_home_hero.png")
    if os.path.exists(img1_path):
        s1.shapes.add_picture(img1_path, Inches(7.5), Inches(1.2), Inches(5.0), Inches(5.1))

    # ==========================================
    # SLIDE 2: Pilar Nilai Utama Frontend
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2, COLOR_BG_LIGHT)
    add_header(s2, "02", "Konsep & Arsitektur", "Pilar utama pengalaman pelanggan di web publik", "Ranah D2C terisolasi pada Port 3000 dengan fokus privasi, presisi nutrisi, dan kemudahan pengguna.")

    # Left Column Cards
    pillars = [
        ("01. Presisi Gizi Klinis", "Kalkulasi gramatur makronutrisi (Protein, Karbohidrat, Lemak) diukur per gram menggunakan timbangan digital berstandar dapur sentral."),
        ("02. Kontrol Penuh Tanpa Kontrak", "Pelanggan bebas mengubah menu harian, mengganti alamat pengantaran, atau menjeda jadwal katering sebelum jam 20.00 WIB."),
        ("03. Transparansi Mutu (Clean Label)", "Setiap boks dilengkapi QR code verifikasi asal bahan lokal (Beras Wonogiri, Salmon Norwegia) dan hasil uji lab SIG independen."),
        ("04. Perlindungan Data Medis", "Kepatuhan privasi rekam kesehatan sesuai UU PDP No. 27/2022 dengan enkripsi AES-256 dan isolasi total dari jaringan publik.")
    ]

    for idx, (title, desc) in enumerate(pillars):
        top_y = 1.9 + (idx * 1.25)
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_y), Inches(5.8), Inches(1.15))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_CARD_BORDER
        tf = card.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_FOREST
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    if os.path.exists(img1_path):
        s2.shapes.add_picture(img1_path, Inches(7.0), Inches(1.9), Inches(5.5), Inches(5.0))

    # ==========================================
    # SLIDE 3: Sistem Desain UI/UX Anti-AI (Jacob Perks)
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3, COLOR_BG_LIGHT)
    add_header(s3, "03", "Standar Desain Visual", "Penerapan sistem desain anti-AI murni", "30 aturan ketat Jacob Perks Framework demi estetika organik berbobot dan humanis.")

    rules = [
        ("Warna Flat Organik Murni", "Tanpa gradien linear atau radial. Menggunakan palet fisik: off-white tebu (#FDFBF7), near-black (#1A1310), forest avocado (#2C4A3E), dan terracotta (#D96B43)."),
        ("Tipografi Humanis Terpilih", "Fraunces untuk judul display berwibawa dan Manrope untuk teks antarmuka. Dilarang menggunakan font default generator AI (Inter/Roboto)."),
        ("Sentence Case Menyeluruh", "Semua tombol dan judul wajib berhuruf kapital hanya di awal kalimat. Tidak menggunakan Title Case kapital di setiap kata."),
        ("Mikro-Detail Taktil & Konsentris", "Tekstur film grain SVG feTurbulence berdensitas mikro, sudut konsentris (inner = outer - gap), dan tinggi dinamis 100dvh.")
    ]

    for idx, (rtitle, rdesc) in enumerate(rules):
        top_y = 1.9 + (idx * 1.25)
        rcard = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_y), Inches(5.8), Inches(1.15))
        rcard.fill.solid()
        rcard.fill.fore_color.rgb = COLOR_CARD_BG
        rcard.line.color.rgb = COLOR_CARD_BORDER
        tf = rcard.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = rtitle
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_TERRACOTTA
        p2 = tf.add_paragraph()
        p2.text = rdesc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    img_clean_path = os.path.join(ASSETS_DIR, "04_clean_label_card.png")
    if os.path.exists(img_clean_path):
        s3.shapes.add_picture(img_clean_path, Inches(7.0), Inches(1.9), Inches(5.5), Inches(5.0))

    # ==========================================
    # SLIDE 4: Beranda & Hero Section
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4, COLOR_BG_LIGHT)
    add_header(s4, "04", "Halaman Beranda", "Antarmuka hero beranda: sajian visual & fakta riil", "Kombinasi headline berbobot, tombol aksi berbasis hasil, dan galeri boks makanan nyata.")

    # Left Column Bullet Points
    hero_box = s4.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(5.8), Inches(5.0))
    tf4 = hero_box.text_frame
    tf4.word_wrap = True

    h_bullets = [
        ("Headline Berbobot & Bernas", "Judul tegas: 'Makanan sehat berstandar restoran. Diukur presisi per gram gizi.' dengan penataan teks berimbang (text-wrap: balance)."),
        ("Tombol Aksi Berbasis Hasil", "CTA spesifik yang berorientasi hasil nyata: 'Hitung kebutuhan kalori TDEE' dan 'Lihat rotasi 60 menu' menggantikan kata generik."),
        ("Angka Riil Spesifik (Lumpy Numbers)", "Menampilkan metrik nyata: 1.842 pax pelanggan mingguan, toleransi timbangan ± 4.2 gram, dan kepuasan pelanggan 4.9 / 5.0."),
        ("Galeri Makanan Nir-Ilustrasi", "Foto asli boks katering berbahan ramah lingkungan yang dimasak sous-vide dan dipanggang segar tanpa ilustrasi vektor palsu.")
    ]

    for title, desc in h_bullets:
        p1 = tf4.add_paragraph()
        p1.text = "• " + title
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_FOREST
        p1.space_before = Pt(8)
        p2 = tf4.add_paragraph()
        p2.text = "  " + desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.space_after = Pt(8)

    if os.path.exists(img1_path):
        s4.shapes.add_picture(img1_path, Inches(7.0), Inches(1.9), Inches(5.5), Inches(5.0))

    # ==========================================
    # SLIDE 5: Kalkulator Metabolisme Klinis TDEE
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5, COLOR_BG_LIGHT)
    add_header(s5, "05", "Kalkulator Interaktif", "Kalkulator metabolisme TDEE & Bento Grid gizi", "Perhitungan kebutuhan energi biologis Mifflin-St Jeor dengan umpan balik gramatur seketika.")

    calc_box = s5.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(5.5), Inches(5.0))
    tf5 = calc_box.text_frame
    tf5.word_wrap = True

    c_points = [
        ("Formula Klinis Terstandar", "Mengimplementasikan algoritma Mifflin-St Jeor untuk menghitung Basal Metabolic Rate (BMR) dengan penyesuaian gender biologis dan 5 level aktivitas."),
        ("Pembagian Makronutrisi Presisi", "Menghasilkan gramatur bersih per porsi: Protein, Karbohidrat kompleks, dan Lemak baik sesuai target (Weight loss, Muscle gain, atau Vitality)."),
        ("Kartu Rekomendasi Terakota & Hijau", "Panel sisi kanan menampilkan estimasi kalori harian (misal: 1.440 kkal), harga paket harian (Rp 85.000), dan tombol pemilihan paket langsung.")
    ]

    for title, desc in c_points:
        p1 = tf5.add_paragraph()
        p1.text = "• " + title
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_FOREST
        p1.space_before = Pt(10)
        p2 = tf5.add_paragraph()
        p2.text = "  " + desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.space_after = Pt(12)

    img_tdee_path = os.path.join(ASSETS_DIR, "02_tdee_calculator.png")
    if os.path.exists(img_tdee_path):
        s5.shapes.add_picture(img_tdee_path, Inches(6.6), Inches(1.9), Inches(5.9), Inches(5.0))

    # ==========================================
    # SLIDE 6: Katalog Menu Mingguan & Fleksibilitas Rotasi
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6, COLOR_BG_LIGHT)
    add_header(s6, "06", "Katalog Sajian", "Katalog 60 resep rotasi & proteksi data pelanggan", "Eksplorasi variasi menu bergizi seimbang tanpa menanam data dummy di kode antarmuka.")

    menu_box = s6.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(5.5), Inches(5.0))
    tf6 = menu_box.text_frame
    tf6.word_wrap = True

    m_points = [
        ("Rotasi 60 Resep Terverifikasi", "Menu bervariasi dari Salmon Sous-Vide, Wagyu Chimichurri, hingga Ayam Betutu Bali, mencegah kebosanan rasa pada program langganan jangka panjang."),
        ("Jadwal Tayang Berbasis Hari Riil", "Ketersediaan menu diatur berdasarkan daftar tanggal spesifik (availableDays) yang sinkron langsung dengan inventaris dapur sentral."),
        ("Proteksi Akses Tanpa Bocor Data", "Sesuai aturan arsitektur data, antarmuka penukaran menu dilindungi modal login resmi tanpa menampilkan data palsu saat pengguna belum terautentikasi.")
    ]

    for title, desc in m_points:
        p1 = tf6.add_paragraph()
        p1.text = "• " + title
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_FOREST
        p1.space_before = Pt(10)
        p2 = tf6.add_paragraph()
        p2.text = "  " + desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.space_after = Pt(12)

    img_menu_path = os.path.join(ASSETS_DIR, "03_menu_catalog.png")
    if os.path.exists(img_menu_path):
        s6.shapes.add_picture(img_menu_path, Inches(6.6), Inches(1.9), Inches(5.9), Inches(5.0))

    # ==========================================
    # SLIDE 7: Dashboard Manajemen Langganan Pelanggan
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7, COLOR_BG_LIGHT)
    add_header(s7, "07", "Portal Dashboard", "Kendali mandiri jadwal langganan & batas waktu 20.00 WIB", "Memberikan otonomi fleksibel bagi pelanggan untuk mengelola ritme pengantaran harian.")

    dash_box = s7.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(5.5), Inches(5.0))
    tf7 = dash_box.text_frame
    tf7.word_wrap = True

    d_points = [
        ("Penukaran Menu H+1 Mudah", "Pelanggan dapat mengganti menu sajian besok dengan satu klik jika menginginkan variasi protein atau sayuran yang berbeda."),
        ("Jeda (Pause) Langganan Taktil", "Fitur jeda katering saat dinas ke luar kota atau berlibur, menjaga saldo kuota boks makanan tanpa hangus."),
        ("Penegakan Batas Waktu 20.00 WIB", "Aturan cutoff ketat dengan indikator waktu nyata WIB. Perubahan setelah jam 20.00 dikunci demi kepastian rute koki dapur dan logistik kurir pagi."),
        ("Ganti Alamat & Pinpoint GPS", "Dukungan pengalihan pengantaran antara alamat kantor (SCBD) dan rumah tinggal beserta catatan satpam.")
    ]

    for title, desc in d_points:
        p1 = tf7.add_paragraph()
        p1.text = "• " + title
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_FOREST
        p1.space_before = Pt(6)
        p2 = tf7.add_paragraph()
        p2.text = "  " + desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.space_after = Pt(8)

    img_dash_path = os.path.join(ASSETS_DIR, "08_dashboard_active.png")
    if os.path.exists(img_dash_path):
        s7.shapes.add_picture(img_dash_path, Inches(6.6), Inches(1.9), Inches(5.9), Inches(5.0))

    # ==========================================
    # SLIDE 8: Verifikasi Mutu & Transparansi Clean Label
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8, COLOR_BG_LIGHT)
    add_header(s8, "08", "Inovasi Clean Label", "Verifikasi transparansi mutu & uji laboratorium", "Memindai kode QR pada boks untuk melihat sertifikat lab resmi dan ketertelusuran petani.")

    ver_box = s8.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(5.5), Inches(5.0))
    tf8 = ver_box.text_frame
    tf8.word_wrap = True

    v_points = [
        ("Sertifikat Uji Lab SIG Independen", "Menampilkan sertifikat SIG No. SIG-LAB/2026/08942-ND yang membuktikan hidangan bebas pestisida, logam berat merkuri, dan formalin."),
        ("Ketertelusuran Petani Lokal", "Memperlihatkan asal bahan baku berkualitas: Beras Merah Aromatik Wonogiri, Sayur Hidroponik Lembang, dan Salmon Segar Norwegia."),
        ("Catatan Suhu Masak Dapur Presisi", "Transparansi parameter pengolahan koki: suhu sous-vide 52.5°C untuk menjaga kelembutan protein dan nilai nutrisi alami makanan."),
        ("Audit Kepatuhan Gizi", "Hasil penimbangan digital di dapur sentral dengan kepatuhan gramatur 99.6% terhadap target diet pelanggan.")
    ]

    for title, desc in v_points:
        p1 = tf8.add_paragraph()
        p1.text = "• " + title
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_FOREST
        p1.space_before = Pt(6)
        p2 = tf8.add_paragraph()
        p2.text = "  " + desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.space_after = Pt(8)

    img_ver_path = os.path.join(ASSETS_DIR, "05_verify_page.png")
    if os.path.exists(img_ver_path):
        s8.shapes.add_picture(img_ver_path, Inches(6.6), Inches(1.9), Inches(5.9), Inches(5.0))

    # ==========================================
    # SLIDE 9: Alur Checkout & Simulasi Pembayaran
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9, COLOR_BG_LIGHT)
    add_header(s9, "09", "Checkout Digital", "Alur langganan fleksibel & pembayaran aman", "Proses konfirmasi pemesanan terpadu dengan integrasi simulasi payment gateway Midtrans Snap.")

    chk_box = s9.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(5.5), Inches(5.0))
    tf9 = chk_box.text_frame
    tf9.word_wrap = True

    k_points = [
        ("Struktur Paket Transparan", "Pilihan durasi: 5 hari (mingguan), 20 hari kerja (diskon 10%), dan 30 hari kerja (diskon 15%) dengan perhitungan rincian otomatis."),
        ("Metode Pembayaran Lengkap", "Mendukung QRIS instan (BCA, GoPay, OVO, ShopeePay), Virtual Account otomatis, dan autodebet berkala terenkripsi PCI-DSS."),
        ("Persetujuan Medis UU PDP Eksplisit", "Formulir menyertakan kotak persetujuan pemrosesan data fisik dan riwayat kesehatan sesuai UU PDP No. 27/2022 sebelum pembayaran diproses."),
        ("Simulasi Midtrans Sandbox", "Integrasi payment gateway yang aman dengan tokenisasi Snap mock untuk simulasi lingkungan pengembangan.")
    ]

    for title, desc in k_points:
        p1 = tf9.add_paragraph()
        p1.text = "• " + title
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_FOREST
        p1.space_before = Pt(6)
        p2 = tf9.add_paragraph()
        p2.text = "  " + desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.space_after = Pt(8)

    img_chk_path = os.path.join(ASSETS_DIR, "06_checkout_page.png")
    if os.path.exists(img_chk_path):
        s9.shapes.add_picture(img_chk_path, Inches(6.6), Inches(1.9), Inches(5.9), Inches(5.0))

    # ==========================================
    # SLIDE 10: Keamanan Akun & Kepatuhan Privasi Data Medis
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10, COLOR_BG_LIGHT)
    add_header(s10, "10", "Privasi & Keamanan", "Keamanan akun & kepatuhan data medis klinis", "Penerapan standar kriptografi tinggi untuk menjamin kerahasiaan data nutrisi setiap pelanggan.")

    sec_box = s10.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(5.5), Inches(5.0))
    tf10 = sec_box.text_frame
    tf10.word_wrap = True

    s_points = [
        ("Hashing Password Argon2id", "Kata sandi di-hash menggunakan algoritma modern Argon2id dengan memori 19 MiB per percobaan, mencegah serangan brute-force."),
        ("Token Akses HTTP-Only 15 Menit", "Token otentikasi disimpan dalam cookie HTTP-only dengan masa berlaku 15 menit dan mekanisme rotasi otomatis yang aman dari XSS."),
        ("Proteksi Brute-Force & Lockout", "Sistem mengunci akun sementara selama 15 menit jika terjadi 5 kali kegagalan login berturut-turut."),
        ("Rekam Medis Terenkripsi AES-256", "Di tab profil akun (/account), riwayat diet dan alergi pelanggan dilindungi enkripsi simetris tingkat militer.")
    ]

    for title, desc in s_points:
        p1 = tf10.add_paragraph()
        p1.text = "• " + title
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_FOREST
        p1.space_before = Pt(6)
        p2 = tf10.add_paragraph()
        p2.text = "  " + desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.space_after = Pt(8)

    img_log_path = os.path.join(ASSETS_DIR, "07_login_page.png")
    if os.path.exists(img_log_path):
        s10.shapes.add_picture(img_log_path, Inches(6.6), Inches(1.9), Inches(5.9), Inches(5.0))

    # ==========================================
    # SLIDE 11: Pengalaman Mobile & Desain Responsif (PWA)
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    set_bg(s11, COLOR_BG_LIGHT)
    add_header(s11, "11", "Desain Responsif", "Optimalisasi mobile PWA & navigasi satu tangan", "Pengalaman mulus di ponsel pintar untuk kenyamanan pelanggan memeriksa katering saat bepergian.")

    mob_box = s11.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(5.2), Inches(5.0))
    tf11 = mob_box.text_frame
    tf11.word_wrap = True

    o_points = [
        ("Bilah Navigasi Bawah (Bottom Bar)", "Navigasi taktil ramah ibu jari: Beranda, Kalkulator, Langganan, dan Label QR yang memudahkan perpindahan menu di smartphone."),
        ("Tata Letak Adaptif Bebas Reflow", "Struktur kisi Bento Grid bertransformasi elegan menjadi kartu vertikal bertumpuk di layar kecil tanpa pemotongan teks."),
        ("Target Sentuh Ergonomis", "Semua tombol dan pemilih input memiliki area sentuh minimum 44px dengan umpan balik visual instan."),
        ("Kecepatan Muat Ringan", "Optimasi gambar WebP/JPEG Next.js dan pembagian chunk kode (First Load JS hanya ~84.8 kB) memastikan akses kilat.")
    ]

    for title, desc in o_points:
        p1 = tf11.add_paragraph()
        p1.text = "• " + title
        p1.font.name = FONT_DISPLAY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_FOREST
        p1.space_before = Pt(6)
        p2 = tf11.add_paragraph()
        p2.text = "  " + desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.space_after = Pt(8)

    img_mob1_path = os.path.join(ASSETS_DIR, "08_mobile_home.png")
    img_mob2_path = os.path.join(ASSETS_DIR, "10_mobile_verify.png")

    if os.path.exists(img_mob1_path):
        s11.shapes.add_picture(img_mob1_path, Inches(6.5), Inches(1.9), Inches(3.0), Inches(5.0))
    if os.path.exists(img_mob2_path):
        s11.shapes.add_picture(img_mob2_path, Inches(9.8), Inches(1.9), Inches(3.0), Inches(5.0))

    # ==========================================
    # SLIDE 12: Ringkasan Arsitektur & Penutup
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    set_bg(s12, COLOR_FOREST)

    add_header(s12, "12", "Kesimpulan & Penutup", "Fondasi teknologi frontend yang kokoh & siap produksi", "Platform antarmuka modern yang siap menghadirkan standar baru katering sehat di Indonesia.", dark=True)

    summary_items = [
        ("Next.js 14 App Router", "Render hibrida SSR/SSG untuk 15 rute aplikasi dengan kecepatan muat optimal dan indeksasi SEO sempurna."),
        ("Tailwind & Jacob Perks UI", "Sistem desain organik tanpa gradien, tipografi Fraunces & Manrope, dan palet warna bumi tebu alami."),
        ("Pemisahan Port Bersih", "Ranah publik port 3000 terisolasi fisik dari port 4000 (dapur KDS dan portal tele-gizi admin) sesuai UU PDP."),
        ("Kesiapan Produksi Penuh", "Build terverifikasi 100% tanpa galat linting, lolos 52 pengujian unit otomatis, dan siap melayani pelanggan.")
    ]

    for idx, (stitle, sdesc) in enumerate(summary_items):
        col = idx % 2
        row = idx // 2
        left_x = 1.0 + (col * 5.8)
        top_y = 2.0 + (row * 2.3)

        scard = s12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left_x), Inches(top_y), Inches(5.4), Inches(2.0))
        scard.fill.solid()
        scard.fill.fore_color.rgb = COLOR_FOREST_DARK
        scard.line.color.rgb = RGBColor(70, 110, 95)
        stf = scard.text_frame
        stf.word_wrap = True
        
        sp1 = stf.paragraphs[0]
        sp1.text = stitle
        sp1.font.name = FONT_DISPLAY
        sp1.font.size = Pt(16)
        sp1.font.bold = True
        sp1.font.color.rgb = RGBColor(230, 160, 120)
        sp1.space_after = Pt(8)

        sp2 = stf.add_paragraph()
        sp2.text = sdesc
        sp2.font.name = FONT_BODY
        sp2.font.size = Pt(12)
        sp2.font.color.rgb = RGBColor(235, 240, 235)

    prs.save(OUTPUT_PPTX)
    print(f"Presentasi berhasil dibuat di: {OUTPUT_PPTX}")

if __name__ == "__main__":
    create_deck()
