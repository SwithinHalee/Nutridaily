import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateRecipeData,
  RECIPES_REPOSITORY,
  RecipePatch,
  RecipeRecord,
  RecipesRepository,
} from './repository/recipes.repository';

export interface IngredientSource {
  name: string;
  origin: string;
  harvestMethod: string;
  certifications: string[];
}

export interface GrammageSpec {
  label: string;
  weight: string;
}

export interface NutritionFacts {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sodiumMg: number;
  glycemicIndex: number;
}

export interface LabCertification {
  laboratory: string;
  certificateNumber: string;
  testDate: string;
  status: string;
  microbiology: string;
  accuracyRating: string;
}

export interface VerifiedMealItem {
  id: string;
  skuCode: string;
  qrCode: string;
  isActive: boolean;
  batchCode: string;
  ticketNumber: string;
  shortTitle: string;
  recipeTitle: string;
  category: string;
  portionWeightGrams: number;
  toleranceGrams: number;
  imageUrl: string;
  imageCaption: string;
  packagingTimestamp: string;
  nutritionFacts: NutritionFacts;
  labCertification: LabCertification;
  ingredientsSourcing: IngredientSource[];
  grammage: GrammageSpec[];
  chefNotes: string;
  allergenWarning: string[];
}

export interface MenuItem {
  id: string;
  sku: string;
  title: string;
  category: string;
  calories: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  cookingMethod: string;
  farmerPartner: string;
  imageUrl: string;
  isAvailable: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  availableDays?: string[] | null;
}

export interface WeeklyDay {
  dayName: string;
  dateNum: string;
  fullDate: string;
  isToday: boolean;
}

@Injectable()
export class RecipesService {
  private static readonly DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  private static readonly MONTH_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];

  /**
   * Menyusun jadwal Senin sampai Jumat berdasarkan tanggal nyata WIB.
   * Pada Sabtu dan Minggu dapur tutup sehingga yang ditampilkan adalah Senin
   * sampai Jumat minggu berikutnya tanpa penanda hari ini.
   * weekOffset menggeser tampilan per minggu (1 untuk minggu depan).
   */
  private buildWeeklyDays(fromDate: Date = new Date(), weekOffset = 0): WeeklyDay[] {
    const shifted = new Date(fromDate.getTime() + weekOffset * 7 * 86400000);
    const utcTime = shifted.getTime() + shifted.getTimezoneOffset() * 60000;
    const wibTime = new Date(utcTime + 3600000 * 7);
    const todayStr = `${wibTime.getFullYear()}-${String(wibTime.getMonth() + 1).padStart(2, '0')}-${String(wibTime.getDate()).padStart(2, '0')}`;
    const todayDow = new Date(Date.UTC(wibTime.getFullYear(), wibTime.getMonth(), wibTime.getDate())).getUTCDay();

    const monday = new Date(Date.UTC(wibTime.getFullYear(), wibTime.getMonth(), wibTime.getDate()));
    if (todayDow === 0) {
      monday.setUTCDate(monday.getUTCDate() + 1);
    } else if (todayDow === 6) {
      monday.setUTCDate(monday.getUTCDate() + 2);
    } else {
      monday.setUTCDate(monday.getUTCDate() - (todayDow - 1));
    }

    return RecipesService.DAY_NAMES.map((dayName, idx) => {
      const cursor = new Date(monday.getTime() + idx * 86400000);
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      const date = cursor.getUTCDate();
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      return {
        dayName,
        dateNum: `${String(date).padStart(2, '0')} ${RecipesService.MONTH_SHORT[month]}`,
        fullDate,
        isToday: fullDate === todayStr,
      };
    });
  }

  /**
   * Katalog seed awal. Hanya dipakai untuk pengisian pertama database kosong
   * (importCatalogIntoStore). Seluruh baca runtime wajib dari database.
   */
  private readonly catalogMeals: MenuItem[] = [
    {
      id: 'm1',
      sku: 'ND-WL-001',
      title: 'Sous-vide Atlantic salmon dengan nasi merah aromatik dan asparagus',
      category: 'Weight loss',
      calories: 438,
      proteinG: 41,
      carbG: 36,
      fatG: 14,
      cookingMethod: 'Sous-vide konstan pada suhu 52.5°C selama 45 menit',
      farmerPartner: 'Beras dari Koperasi Tani Wonogiri, sayur panen subuh Kopeng',
      imageUrl: '/images/meals/salmon_meal.jpg',
      isAvailable: true,
    },
    {
      id: 'm2',
      sku: 'ND-MG-002',
      title: 'Daging wagyu rump mb9 panggang dengan tumbukan kembang kol truffle',
      category: 'Muscle gain',
      calories: 672,
      proteinG: 56,
      carbG: 41,
      fatG: 27,
      cookingMethod: 'Reverse sear dengan garam laut kusamba Bali',
      farmerPartner: 'Kembang kol hidroponik dari perkebunan Lembang',
      imageUrl: '/images/meals/wagyu_meal.jpg',
      isAvailable: true,
    },
    {
      id: 'm3',
      sku: 'ND-TD-003',
      title: 'Dada ayam probiotik kuah rempah dengan quinoa tiga warna',
      category: 'Therapeutic DASH',
      calories: 486,
      proteinG: 45,
      carbG: 39,
      fatG: 12,
      cookingMethod: 'Slow braise dengan kaldu tulang alami tanpa tambahan garam',
      farmerPartner: 'Ayam probiotik bebas antibiotik dari peternakan Sukabumi',
      imageUrl: '/images/meals/chicken_meal.jpg',
      isAvailable: true,
    },
    {
      id: 'm4',
      sku: 'ND-VT-004',
      title: 'Medali tempe dan tahu organik dengan saus edamame tumbuk',
      category: 'Vitality plant-based',
      calories: 412,
      proteinG: 31,
      carbG: 42,
      fatG: 11,
      cookingMethod: 'Pan-seared dengan minyak zaitun perasan dingin pertama',
      farmerPartner: 'Kedelai non-gmo dari petani lokal Grobogan',
      imageUrl: '/images/meals/tempe_meal.jpg',
      isAvailable: true,
    },
    {
      id: 'm5',
      sku: 'ND-WL-005',
      title: 'Atlantic salmon panggang rosemary dengan salad kentang ungu',
      category: 'Weight loss',
      calories: 452,
      proteinG: 42,
      carbG: 35,
      fatG: 15,
      cookingMethod: 'Slow roasted suhu rendah 110°C dengan minyak zaitun perasan dingin',
      farmerPartner: 'Ubi dan kentang ungu organik dari kelompok tani lereng Merbabu',
      imageUrl: '/images/meals/salmon_rosemary.jpg',
      isAvailable: true,
    },
    {
      id: 'm6',
      sku: 'ND-MG-006',
      title: 'Daging wagyu striploin bakar chimichurri dengan jagung manis bakar',
      category: 'Muscle gain',
      calories: 695,
      proteinG: 54,
      carbG: 44,
      fatG: 29,
      cookingMethod: 'Charcoal grill suhu tinggi cepat untuk mengunci sari daging murni',
      farmerPartner: 'Jagung manis bebas residu pestisida kemitraan Boyolali',
      imageUrl: '/images/meals/wagyu_striploin.jpg',
      isAvailable: true,
    },
    {
      id: 'm7',
      sku: 'ND-TD-007',
      title: 'Dada ayam bakar bumbu rujak kelapa muda dengan tumis buncis baby',
      category: 'Therapeutic DASH',
      calories: 475,
      proteinG: 44,
      carbG: 37,
      fatG: 13,
      cookingMethod: 'Panggang oven uap konveksi dengan perasan air kelapa murni rendah natrium',
      farmerPartner: 'Buncis baby segar kelompok tani organik dataran tinggi Dieng',
      imageUrl: '/images/meals/chicken_rujak.jpg',
      isAvailable: true,
    },
    {
      id: 'm8',
      sku: 'ND-VT-008',
      title: 'Dada ayam suwir kukus sambal matah kecombrang dengan nasi barley',
      category: 'Vitality daily',
      calories: 445,
      proteinG: 43,
      carbG: 38,
      fatG: 12,
      cookingMethod: 'Kukus herbal aromatik serai daun jeruk dengan takaran 1 sendok teh minyak kelapa dingin',
      farmerPartner: 'Kecombrang liar dan cabai rawit panen segar perkebunan Ciwidey',
      imageUrl: '/images/meals/chicken_matah.jpg',
      isAvailable: true,
    },
  ];

  /**
   * Data seed sertifikasi awal per SKU. Hanya dipakai untuk pengisian pertama
   * database kosong (importCatalogIntoStore). Seluruh baca runtime wajib dari database.
   */
  private readonly verifiedMeals: VerifiedMealItem[] = [
    {
      id: 'salmon-sousvide',
      skuCode: 'ND-WL-001',
      qrCode: 'ND-VERIFY-SALMON-2026',
      isActive: true,
      batchCode: '2026-10-03-P1',
      ticketNumber: 'Tiket produksi dapur #0042',
      shortTitle: 'Atlantic salmon',
      recipeTitle: 'Sous-vide Atlantic salmon dengan wild red rice dan asparagus',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 395,
      toleranceGrams: 4.2,
      imageUrl: '/images/meals/salmon_meal.jpg',
      imageCaption: 'Dokumentasi boks katering salmon sous-vide sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.30 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 438,
        proteinGrams: 41,
        carbsGrams: 36,
        fatGrams: 14,
        fiberGrams: 6.5,
        sodiumMg: 365,
        glycemicIndex: 42,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/08942-ND',
        testDate: '15 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Atlantic salmon fillet grade sashimi',
          origin: 'Fjord Barat Norwegia (Perikanan Berkelanjutan Sertifikasi MSC)',
          harvestMethod: 'Pengiriman rantai dingin 0 sampai 2°C tanpa pembekuan berulang',
          certifications: ['ASC Certified', 'BAP 4-Star'],
        },
        {
          name: 'Beras merah organik aromatik',
          origin: 'Koperasi Tani Organik Berkah, Wonogiri, Jawa Tengah',
          harvestMethod: 'Panen tradisional 28 September 2026 dengan pengairan mata air pegunungan',
          certifications: ['SNI Organik Indonesia No. 67/LSPO-005', 'Halal Kemenag'],
        },
        {
          name: 'Green asparagus dan baby carrots',
          origin: 'Kelompok Tani Dataran Tinggi Kopeng, Jawa Tengah',
          harvestMethod: 'Dipetik subuh pukul 04.30 WIB tanggal 03 Oktober 2026',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Minyak zaitun extra virgin dan perasan lemon',
          origin: 'Perasan dingin pertama zaitun Spanyol dan rempah Nusantara',
          harvestMethod: 'Ekstraksi mekanik alami tanpa bahan pengawet sintetis',
          certifications: ['Non-GMO Verified'],
        },
      ],
      grammage: [
        { label: 'Fillet salmon', weight: '180 gram' },
        { label: 'Beras merah', weight: '120 gram' },
        { label: 'Asparagus hijau', weight: '75 gram' },
        { label: 'Saus herba lemon', weight: '30 ml' },
      ],
      chefNotes:
        'Dimasak dengan metode precision sous-vide pada temperatur konstan 52.5°C selama 45 menit untuk menjaga integritas asam lemak omega-3 dan tekstur ikan.',
      allergenWarning: ['Mengandung ikan laut (Atlantic salmon)'],
    },
    {
      id: 'wagyu-rump',
      skuCode: 'ND-MG-002',
      qrCode: 'ND-VERIFY-WAGYU-2026',
      isActive: true,
      batchCode: '2026-10-03-P6',
      ticketNumber: 'Tiket produksi dapur #0189',
      shortTitle: 'Wagyu rump mb9',
      recipeTitle: 'Daging wagyu rump mb9 panggang dengan tumbukan kembang kol',
      category: 'Muscle gain (fit & build)',
      portionWeightGrams: 405,
      toleranceGrams: 4.1,
      imageUrl: '/images/meals/wagyu_meal.jpg',
      imageCaption: 'Dokumentasi boks katering wagyu rump mb9 sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.45 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 560,
        proteinGrams: 58,
        carbsGrams: 18,
        fatGrams: 24,
        fiberGrams: 6.2,
        sodiumMg: 395,
        glycemicIndex: 35,
      },
      labCertification: {
        laboratory: 'PT Sucofindo Health & Nutrition Testing',
        certificateNumber: 'SUCO-NUTRI/2026/9021-ND',
        testDate: '26 September 2026',
        status: '100% Halal certified, bebas hormon sintetis dan residu pestisida',
        microbiology: 'Uji cemaran bakteri patogen dinyatakan negatif',
        accuracyRating: 'Presisi protein makro 58 gram terverifikasi Sucofindo',
      },
      ingredientsSourcing: [
        {
          name: 'Full-Blood Wagyu Rump MB9+',
          origin: 'Darling Downs, Queensland, Australia',
          harvestMethod: 'Sapi wagyu pedigree murni dengan rasio marbling tinggi alami',
          certifications: ['Halal Australia', 'MSA Standards'],
        },
        {
          name: 'Kembang kol hidroponik greenhouse',
          origin: 'Petani Organik Lembang, Jawa Barat',
          harvestMethod: 'Panen 02 Oktober 2026 alternatif karbohidrat rendah GI',
          certifications: ['Bebas Pestisida Kimia'],
        },
        {
          name: 'Baby buncis Prancis organik',
          origin: 'Dataran Tinggi Dieng, Jawa Tengah',
          harvestMethod: 'Dipetik subuh dengan tekstur renyah alami',
          certifications: ['SNI Organik Indonesia'],
        },
        {
          name: 'Garam laut kristal murni Kusamba',
          origin: 'Petani Garam Tradisional Kusamba, Klungkung, Bali',
          harvestMethod: 'Kristalisasi alami meja garam kayu kelapa',
          certifications: ['Non-Iodized Mineral Sea Salt'],
        },
      ],
      grammage: [
        { label: 'Wagyu rump MB9', weight: '190 gram' },
        { label: 'Puree kembang kol', weight: '140 gram' },
        { label: 'Baby buncis Prancis', weight: '60 gram' },
        { label: 'Minyak truffle', weight: '15 ml' },
      ],
      chefNotes:
        'Tumbukan kembang kol diolah sebagai alternatif karbohidrat rendah glikemik yang kaya serat, dipadu bumbu herba segar dan minyak zaitun tanpa mentega olahan.',
      allergenWarning: ['Mengandung daging sapi wagyu'],
    },
    {
      id: 'chicken-quinoa',
      skuCode: 'ND-TD-003',
      qrCode: 'ND-VERIFY-CHICKEN-2026',
      isActive: true,
      batchCode: '2026-10-03-P7',
      ticketNumber: 'Tiket produksi dapur #0204',
      shortTitle: 'Ayam quinoa',
      recipeTitle: 'Dada ayam probiotik kuah rempah dengan quinoa tiga warna',
      category: 'Therapeutic diet (DASH & low GI)',
      portionWeightGrams: 425,
      toleranceGrams: 3.6,
      imageUrl: '/images/meals/chicken_meal.jpg',
      imageCaption: 'Dokumentasi boks katering ayam probiotik quinoa sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 08.00 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 395,
        proteinGrams: 48,
        carbsGrams: 34,
        fatGrams: 8,
        fiberGrams: 7.8,
        sodiumMg: 240,
        glycemicIndex: 36,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/08955-ND',
        testDate: '28 September 2026',
        status: 'Bebas garam tambahan, rasa gurih alami dari reduksi kaldu tulang tanpa MSG',
        microbiology: 'Uji pestisida dan mikrobiologi teruji negatif',
        accuracyRating: 'Akurasi formula klinis 99.8%',
      },
      ingredientsSourcing: [
        {
          name: 'Dada ayam probiotik bebas antibiotik',
          origin: 'Peternakan Ramah Hewan Sukabumi, Jawa Barat',
          harvestMethod: 'Panen 02 Oktober 2026 peternakan probiotik bersertifikat',
          certifications: ['Halal Kemenag', 'NKV Certified'],
        },
        {
          name: 'Quinoa tiga warna organik',
          origin: 'Dataran Tinggi Andes, Amerika Selatan',
          harvestMethod: 'Panen kering alami sumber asam amino esensial lengkap',
          certifications: ['Fair Trade', 'Non-GMO Project Verified'],
        },
        {
          name: 'Brokoli hijau baby',
          origin: 'Kelompok Tani Dataran Tinggi Kopeng, Jawa Tengah',
          harvestMethod: 'Dipetik subuh 03 Oktober 2026',
          certifications: ['SNI Organik Indonesia'],
        },
        {
          name: 'Kaldu rempah jahe merah dan serai',
          origin: 'Petani Rempah Karanganyar, Jawa Tengah',
          harvestMethod: 'Reduksi lambat 6 jam tanpa penyedap rasa sintetis',
          certifications: ['100% Rempah Segar Lokal'],
        },
      ],
      grammage: [
        { label: 'Dada ayam probiotik', weight: '195 gram' },
        { label: 'Quinoa tiga warna', weight: '110 gram' },
        { label: 'Brokoli kukus', weight: '70 gram' },
        { label: 'Kaldu rempah alami', weight: '50 ml' },
      ],
      chefNotes:
        'Kaldu rempah diseduh lambat selama 6 jam dengan jahe merah, serai, daun salam, dan bawang putih panggang untuk menghasilkan kuah aromatik kaya antioksidan.',
      allergenWarning: ['Bebas gluten', 'Bebas laktosa', 'Bebas alergen kacang'],
    },
    {
      id: 'tempe-edamame',
      skuCode: 'ND-VT-004',
      qrCode: 'ND-VERIFY-TEMPE-2026',
      isActive: true,
      batchCode: '2026-10-03-P8',
      ticketNumber: 'Tiket produksi dapur #0228',
      shortTitle: 'Medali tempe organik',
      recipeTitle: 'Medali tempe dan tahu organik dengan saus edamame tumbuk',
      category: 'Vitality (plant-based protein)',
      portionWeightGrams: 390,
      toleranceGrams: 3.5,
      imageUrl: '/images/meals/tempe_meal.jpg',
      imageCaption: 'Dokumentasi boks katering medali tempe dan tahu organik sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 08.15 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 412,
        proteinGrams: 31,
        carbsGrams: 42,
        fatGrams: 11,
        fiberGrams: 9.5,
        sodiumMg: 270,
        glycemicIndex: 32,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09420-ND',
        testDate: '29 September 2026',
        status: 'Terverifikasi 100% kedelai non-GMO lokal, bebas residu heksana, formalin, dan pestisida',
        microbiology: 'Uji cemaran kapang aflatoksin dan Salmonella negatif murni',
        accuracyRating: 'Tingkat presisi nutrisi nabati 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Kedelai kuning organik lokal non-GMO',
          origin: 'Koperasi Petani Kedelai Grobogan, Jawa Tengah',
          harvestMethod: 'Panen matang optimal tanpa rekayasa genetika',
          certifications: ['SNI Organik Indonesia', 'Non-GMO Verified'],
        },
        {
          name: 'Edamame segar panen subuh',
          origin: 'Perkebunan Sayur Hijau Jember, Jawa Timur',
          harvestMethod: 'Dipetik segar 02 Oktober 2026 diproses dalam 12 jam',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Tahu susu organik tanpa pengawet',
          origin: 'Sentra Pengrajin Tahu Tradisional Lembang, Jawa Barat',
          harvestMethod: 'Pengentalan alami sari kedelai murni tanpa tawas',
          certifications: ['Halal Kemenag', 'Bebas Pengawet Kimia'],
        },
        {
          name: 'Minyak kelapa dingin dan herba aromatik',
          origin: 'Perkebunan Kelapa Terpadu Banyumas, Jawa Tengah',
          harvestMethod: 'Ekstraksi dingin mempertahankan asam laurat alami',
          certifications: ['100% Bahan Alami Nusantara'],
        },
      ],
      grammage: [
        { label: 'Medali tempe panggang', weight: '150 gram' },
        { label: 'Tahu organik', weight: '90 gram' },
        { label: 'Saus edamame tumbuk', weight: '80 gram' },
        { label: 'Tumis buncis organik', weight: '70 gram' },
      ],
      chefNotes:
        'Tempe dan tahu organik difermentasi secara alami dengan ragi tradisional, kemudian dipanggang lembut dan disajikan bersama puree edamame kaya asam folat.',
      allergenWarning: ['Mengandung kedelai (tempe, tahu, edamame)'],
    },
    {
      id: 'salmon-rosemary',
      skuCode: 'ND-WL-005',
      qrCode: 'ND-VERIFY-SALMON-ROSEMARY-2026',
      isActive: true,
      batchCode: '2026-10-03-P5',
      ticketNumber: 'Tiket produksi dapur #0166',
      shortTitle: 'Salmon rosemary',
      recipeTitle: 'Atlantic salmon panggang rosemary dengan salad kentang ungu',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 400,
      toleranceGrams: 3.9,
      imageUrl: '/images/meals/salmon_rosemary.jpg',
      imageCaption: 'Dokumentasi boks katering salmon rosemary sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.30 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 445,
        proteinGrams: 42,
        carbsGrams: 35,
        fatGrams: 15,
        fiberGrams: 6.0,
        sodiumMg: 340,
        glycemicIndex: 40,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/NUTRI-2026/09102-ND',
        testDate: '24 September 2026',
        status: 'Kandungan asam lemak omega-3 alami teruji stabil setelah slow roasting',
        microbiology: 'Bebas residu logam berat merkuri, timbal, dan arsenik',
        accuracyRating: 'Tingkat presisi gramatur 99.7%',
      },
      ingredientsSourcing: [
        {
          name: 'Atlantic salmon fillet grade sashimi',
          origin: 'Fjord Barat Norwegia',
          harvestMethod: 'Rantai dingin 0 sampai 2°C sertifikasi perikanan lestari',
          certifications: ['MSC Certified', 'ASC Perikanan Berkelanjutan'],
        },
        {
          name: 'Kentang dan ubi ungu organik',
          origin: 'Kelompok Tani Lereng Merbabu, Jawa Tengah',
          harvestMethod: 'Panen 29 September 2026 kaya antioksidan antosianin',
          certifications: ['SNI Organik Indonesia'],
        },
        {
          name: 'Bayam baby segar',
          origin: 'Petani Organik Lembang, Jawa Barat',
          harvestMethod: 'Dipetik subuh 03 Oktober 2026',
          certifications: ['Bebas Pupuk Kimia Sintetis'],
        },
        {
          name: 'Rosemary dan dressing minyak zaitun',
          origin: 'Kebun Herba Organik Batu, Jawa Timur',
          harvestMethod: 'Herba aromatik segar dipetik langsung untuk marinasi',
          certifications: ['100% Organik Alami'],
        },
      ],
      grammage: [
        { label: 'Salmon panggang', weight: '185 gram' },
        { label: 'Kentang ungu panggang', weight: '125 gram' },
        { label: 'Bayam baby salad', weight: '65 gram' },
        { label: 'Dressing rosemary', weight: '25 ml' },
      ],
      chefNotes:
        'Dipanggang perlahan pada suhu 110°C untuk menjaga kestabilan antioksidan antosianin pada kentang ungu dan asam lemak tak jenuh ganda pada salmon.',
      allergenWarning: ['Mengandung ikan laut (Atlantic salmon)'],
    },
    {
      id: 'wagyu-striploin',
      skuCode: 'ND-MG-006',
      qrCode: 'ND-VERIFY-WAGYU-CHIMI-2026',
      isActive: true,
      batchCode: '2026-10-03-P2',
      ticketNumber: 'Tiket produksi dapur #0088',
      shortTitle: 'Wagyu chimichurri',
      recipeTitle: 'Daging wagyu striploin bakar chimichurri dengan jagung manis',
      category: 'Muscle gain (fit & build)',
      portionWeightGrams: 420,
      toleranceGrams: 3.8,
      imageUrl: '/images/meals/wagyu_striploin.jpg',
      imageCaption: 'Dokumentasi boks katering wagyu striploin chimichurri sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.45 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 545,
        proteinGrams: 52,
        carbsGrams: 28,
        fatGrams: 22,
        fiberGrams: 5.2,
        sodiumMg: 410,
        glycemicIndex: 38,
      },
      labCertification: {
        laboratory: 'PT Sucofindo Health & Nutrition Testing',
        certificateNumber: 'SUCO-NUTRI/2026/9144-ND',
        testDate: '18 September 2026',
        status: 'Lulus uji klinis 100% bebas hormon sintetis pertumbuhan dan residu antibiotik',
        microbiology: 'Uji cemaran bakteri coliform dan Staphylococcus aureus negatif',
        accuracyRating: 'Akurasi gramatur makro 99.3% terverifikasi Sucofindo',
      },
      ingredientsSourcing: [
        {
          name: 'Australian Wagyu Striploin MB9+',
          origin: 'Darling Downs, Queensland, Australia',
          harvestMethod: 'Grain-fed 400 hari dengan standar peternakan bebas stres',
          certifications: ['Halal Australia', 'MSA Standards Certified'],
        },
        {
          name: 'Jagung manis segar non-pestisida',
          origin: 'Kemitraan Petani Boyolali, Jawa Tengah',
          harvestMethod: 'Panen matang pohon 02 Oktober 2026',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Edamame organik segar',
          origin: 'Petani Kedelai Organik Grobogan, Jawa Tengah',
          harvestMethod: 'Panen subuh 03 Oktober 2026',
          certifications: ['Non-GMO Project Verified', 'SNI Organik'],
        },
        {
          name: 'Saus chimichurri peterseli segar',
          origin: 'Kebun Rempah Dataran Tinggi Bandung, Jawa Barat',
          harvestMethod: 'Dicacah segar dengan cuka anggur putih dan minyak zaitun extra virgin',
          certifications: ['100% Bahan Alami Tanpa Pengawet'],
        },
      ],
      grammage: [
        { label: 'Wagyu striploin', weight: '185 gram' },
        { label: 'Jagung manis bakar', weight: '100 gram' },
        { label: 'Edamame kukus', weight: '60 gram' },
        { label: 'Saus chimichurri', weight: '35 ml' },
      ],
      chefNotes:
        'Daging wagyu striploin dipanggang api arang kelapa pada suhu 220°C untuk karamelisasi crust luar dengan mempertahankan kelembutan marbling MB9+ di bagian dalam.',
      allergenWarning: ['Mengandung daging sapi wagyu', 'Kedelai (edamame)'],
    },
    {
      id: 'chicken-rujak',
      skuCode: 'ND-TD-007',
      qrCode: 'ND-VERIFY-CHICKEN-RUJAK-2026',
      isActive: true,
      batchCode: '2026-10-03-P3',
      ticketNumber: 'Tiket produksi dapur #0115',
      shortTitle: 'Ayam bumbu rujak',
      recipeTitle: 'Dada ayam bakar bumbu rujak kelapa muda dengan tumis buncis',
      category: 'Therapeutic diet (DASH & low GI)',
      portionWeightGrams: 420,
      toleranceGrams: 3.5,
      imageUrl: '/images/meals/chicken_rujak.jpg',
      imageCaption: 'Dokumentasi boks katering ayam bakar bumbu rujak sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.00 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 410,
        proteinGrams: 46,
        carbsGrams: 32,
        fatGrams: 10,
        fiberGrams: 7.0,
        sodiumMg: 285,
        glycemicIndex: 39,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/NUTRI-2026/09218-ND',
        testDate: '20 September 2026',
        status: 'Terverifikasi kadar natrium rendah terkontrol sesuai rekomendasi diet DASH',
        microbiology: 'Uji Salmonella sp dan Listeria monocytogenes negatif',
        accuracyRating: 'Tingkat presisi nutrisi 99.5%',
      },
      ingredientsSourcing: [
        {
          name: 'Dada ayam probiotik tanpa kulit',
          origin: 'Peternakan Probiotik Alami Sukabumi, Jawa Barat',
          harvestMethod: 'Ayam dibesarkan bebas kandang dengan pakan herbal jamu alami',
          certifications: ['Bebas Hormon & Antibiotik', 'Sertifikat NKV'],
        },
        {
          name: 'Buncis baby petik pucuk',
          origin: 'Kelompok Tani Dataran Tinggi Dieng, Jawa Tengah',
          harvestMethod: 'Dipetik 03 Oktober 2026 pukul 04.00 WIB',
          certifications: ['SNI Organik Indonesia'],
        },
        {
          name: 'Kelapa muda perasan dingin',
          origin: 'Perkebunan Kelapa Terintegrasi Kulon Progo, D.I. Yogyakarta',
          harvestMethod: 'Pengganti gula olahan untuk rasa manis gurih alami',
          certifications: ['100% Nira Murni'],
        },
        {
          name: 'Beras merah aromatik',
          origin: 'Koperasi Tani Organik Wonogiri, Jawa Tengah',
          harvestMethod: 'Panen tradisional pengeringan sinar matahari',
          certifications: ['SNI Organik No. 67/LSPO-005'],
        },
      ],
      grammage: [
        { label: 'Dada ayam probiotik', weight: '190 gram' },
        { label: 'Nasi beras merah', weight: '120 gram' },
        { label: 'Buncis baby segar', weight: '70 gram' },
        { label: 'Bumbu rujak kelapa', weight: '40 ml' },
      ],
      chefNotes:
        'Bumbu rujak dimasak tanpa gula pasir olahan, melainkan reduksi air kelapa muda alami. Dada ayam dimarinasi selama 8 jam dengan rempah segar Nusantara.',
      allergenWarning: ['Bebas gluten', 'Bebas laktosa', 'Bebas kacang tanah'],
    },
    {
      id: 'chicken-matah',
      skuCode: 'ND-VT-008',
      qrCode: 'ND-VERIFY-CHICKEN-MATAH-2026',
      isActive: true,
      batchCode: '2026-10-03-P4',
      ticketNumber: 'Tiket produksi dapur #0142',
      shortTitle: 'Ayam sambal matah',
      recipeTitle: 'Dada ayam suwir kukus sambal matah kecombrang dengan nasi barley',
      category: 'Maintenance (vitality daily)',
      portionWeightGrams: 415,
      toleranceGrams: 4.0,
      imageUrl: '/images/meals/chicken_matah.jpg',
      imageCaption: 'Dokumentasi boks katering ayam suwir sambal matah sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.15 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 425,
        proteinGrams: 44,
        carbsGrams: 42,
        fatGrams: 9,
        fiberGrams: 8.5,
        sodiumMg: 320,
        glycemicIndex: 41,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/NUTRI-2026/09289-ND',
        testDate: '22 September 2026',
        status: 'Terverifikasi indeks glikemik rendah (GI: 41) dan serat pangan tinggi',
        microbiology: 'Uji formalin dan pewarna tekstil negatif murni',
        accuracyRating: 'Akurasi makronutrisi 99.4%',
      },
      ingredientsSourcing: [
        {
          name: 'Kecombrang liar dan cabai rawit',
          origin: 'Perkebunan Hortikultura Lereng Ciwidey, Jawa Barat',
          harvestMethod: 'Panen subuh 03 Oktober 2026 tanpa pestisida kimia sintetis',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Dada ayam probiotik kukus herbal',
          origin: 'Peternakan Probiotik Sukabumi, Jawa Barat',
          harvestMethod: 'Dikukus dengan daun salam, serai, dan jahe emprit',
          certifications: ['Sertifikasi Halal', 'NKV Bebas Antibiotik'],
        },
        {
          name: 'Nasi barley mutiara utuh',
          origin: 'Pertanian Serealia Terkendali Temanggung, Jawa Tengah',
          harvestMethod: 'Penggilingan minimal mempertahankan lapisan dedak kaya serat beta-glukan',
          certifications: ['Whole Grain Council Standard'],
        },
        {
          name: 'Bok choy baby hidroponik',
          origin: 'Greenhouse Hidroponik Lembang, Jawa Barat',
          harvestMethod: 'Dipanen menggunakan air baku mata air pegunungan',
          certifications: ['Pestisida 0%'],
        },
      ],
      grammage: [
        { label: 'Ayam suwir kukus', weight: '185 gram' },
        { label: 'Nasi barley mutiara', weight: '130 gram' },
        { label: 'Bok choy baby', weight: '65 gram' },
        { label: 'Sambal kecombrang', weight: '35 ml' },
      ],
      chefNotes:
        'Sambal matah menggunakan minyak kelapa dingin murni (VCO) tanpa dipanaskan ulang, dipadu dengan potongan bunga kecombrang segar beraroma sitrus herbal.',
      allergenWarning: ['Bebas kacang tanah', 'Bebas susu sapi', 'Bebas gluten'],
    },
  ];

  constructor(@Inject(RECIPES_REPOSITORY) private readonly recipesRepo: RecipesRepository) {}

  public static readonly ACTIVE_MEAL_CAP = 20;
  public static readonly IMAGE_MAX_BYTES = 2 * 1024 * 1024;
  public static readonly IMAGE_MIME_ALLOWLIST = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Memvalidasi berkas gambar dan mengembalikannya sebagai data URL
   * untuk disimpan langsung di kolom imageUrl database.
   */
  public processImageUpload(file: {
    buffer?: Buffer;
    mimetype?: string;
    size?: number;
    originalname?: string;
  }): string {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Berkas gambar tidak terbaca. Pilih file JPG, PNG, atau WebP.');
    }
    if (!RecipesService.IMAGE_MIME_ALLOWLIST.includes(file.mimetype || '')) {
      throw new BadRequestException('Format gambar harus JPG, PNG, atau WebP.');
    }
    const size = file.size ?? file.buffer.length;
    if (size > RecipesService.IMAGE_MAX_BYTES) {
      throw new BadRequestException('Ukuran gambar maksimal 2 MB. Kompres dahulu lalu unggah ulang.');
    }
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }

  private static toDateOrNull(value: unknown): Date | null {
    if (value == null || value === '') return null;
    const parsed = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private static toDateKey(value: Date | string): string {
    const parsed = value instanceof Date ? value : new Date(String(value));
    return parsed.toISOString().substring(0, 10);
  }

  private async countActiveMeals(): Promise<number> {
    const rows = await this.recipesRepo.list();
    return rows.filter((row) => row.isActive).length;
  }

  private async assertActiveCapAllows(additionalActive: number): Promise<void> {
    if (additionalActive <= 0) return;
    const activeCount = await this.countActiveMeals();
    if (activeCount + additionalActive > RecipesService.ACTIVE_MEAL_CAP) {
      throw new BadRequestException(
        `Batas ${RecipesService.ACTIVE_MEAL_CAP} makanan aktif tercapai (${activeCount} aktif). Nonaktifkan salah satu makanan dahulu sebelum mengaktifkan yang baru.`,
      );
    }
  }

  /**
   * Mengecek apakah resep boleh dipesan pada tanggal target (YYYY-MM-DD).
   * Pilihan hari manual lebih utama daripada jendela. Tanpa keduanya dan
   * status aktif berarti selalu tersedia.
   */
  public static isAvailableOn(
    row: {
      isActive: boolean;
      availableFrom: Date | string | null;
      availableUntil: Date | string | null;
      availableDays?: string[] | null;
    },
    targetDateStr: string,
  ): boolean {
    if (!row.isActive) return false;
    if (row.availableDays && row.availableDays.length > 0) {
      return row.availableDays.includes(targetDateStr);
    }
    if (row.availableFrom && this.toDateKey(row.availableFrom) > targetDateStr) return false;
    if (row.availableUntil && this.toDateKey(row.availableUntil) < targetDateStr) return false;
    return true;
  }

  public static weekOverlaps(
    row: {
      availableFrom: Date | string | null;
      availableUntil: Date | string | null;
      availableDays?: string[] | null;
    },
    weekStart: string,
    weekEnd: string,
  ): boolean {
    if (row.availableDays && row.availableDays.length > 0) {
      return row.availableDays.some((d) => d >= weekStart && d <= weekEnd);
    }
    const fromKey = row.availableFrom ? RecipesService.toDateKey(row.availableFrom) : null;
    const untilKey = row.availableUntil ? RecipesService.toDateKey(row.availableUntil) : null;
    if (fromKey && fromKey > weekEnd) return false;
    if (untilKey && untilKey < weekStart) return false;
    return true;
  }

  public async getAvailabilitySummary(): Promise<{
    total: number;
    activeNow: number;
    scheduledFuture: number;
    cap: number;
  }> {
    const rows = await this.listStoredRecipes();
    const todayKey = new Date().toISOString().substring(0, 10);
    let activeNow = 0;
    let scheduledFuture = 0;
    for (const row of rows) {
      if (RecipesService.isAvailableOn(row, todayKey)) activeNow++;
      else if (row.isActive && RecipesService.startsInFuture(row, todayKey)) {
        scheduledFuture++;
      }
    }
    return { total: rows.length, activeNow, scheduledFuture, cap: RecipesService.ACTIVE_MEAL_CAP };
  }

  private static startsInFuture(
    row: {
      availableFrom: Date | string | null;
      availableDays?: string[] | null;
    },
    todayKey: string,
  ): boolean {
    if (Array.isArray(row.availableDays) && row.availableDays.length > 0) {
      return row.availableDays.length > 0 && row.availableDays.every((d) => d > todayKey);
    }
    if (row.availableFrom) return RecipesService.toDateKey(row.availableFrom) > todayKey;
    return false;
  }

  public async listStoredRecipes(): Promise<RecipeRecord[]> {
    let rows = await this.recipesRepo.list();
    if (rows.length === 0) {
      await this.importCatalogIntoStore();
      rows = await this.recipesRepo.list();
    }
    return rows;
  }

  public getStoredRecipe(id: string): Promise<RecipeRecord> {
    return this.recipesRepo.findById(id).then((row) => {
      if (!row) throw new NotFoundException(`Resep dengan ID ${id} tidak ditemukan.`);
      return row;
    });
  }

  private static toDetailsOrNull(value: unknown): Record<string, any> | null {
    if (value == null) return null;
    if (typeof value !== 'object' || Array.isArray(value)) return null;
    const cleaned: Record<string, any> = {};
    const text = (v: unknown): string => (typeof v === 'string' ? v.slice(0, 500) : '');
    const num = (v: unknown): number | undefined =>
      typeof v === 'number' && Number.isFinite(v) ? v : undefined;
    const strList = (v: unknown): string[] | undefined =>
      Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => x.slice(0, 200)) : undefined;
    const src = value as Record<string, any>;
    const assignText = (key: string): void => {
      const t = text(src[key]);
      if (t) cleaned[key] = t;
    };
    ['batchCode', 'ticketNumber', 'shortTitle', 'imageCaption', 'packagingTimestamp', 'chefNotes'].forEach(assignText);
    const fiber = num(src.fiberGrams);
    if (fiber !== undefined) cleaned.fiberGrams = fiber;
    const sodium = num(src.sodiumMg);
    if (sodium !== undefined) cleaned.sodiumMg = sodium;
    const gi = num(src.glycemicIndex);
    if (gi !== undefined) cleaned.glycemicIndex = gi;
    const portion = num(src.portionWeightGrams);
    if (portion !== undefined) cleaned.portionWeightGrams = portion;
    const tolerance = num(src.toleranceGrams);
    if (tolerance !== undefined) cleaned.toleranceGrams = tolerance;
    if (Array.isArray(src.grammage)) {
      const rows = src.grammage
        .filter((g: any) => g && (g.label || g.weight))
        .slice(0, 12)
        .map((g: any) => ({ label: text(g.label) || '-', weight: text(g.weight) || '-' }));
      if (rows.length > 0) cleaned.grammage = rows;
    }
    if (Array.isArray(src.farms)) {
      const rows = src.farms
        .filter((f: any) => f && (f.name || f.location))
        .slice(0, 12)
        .map((f: any) => ({
          name: text(f.name) || '-',
          location: text(f.location || f.origin) || '-',
          harvestDate: text(f.harvestDate || f.harvestMethod) || '-',
          certifications: strList(f.certifications) || [],
        }));
      if (rows.length > 0) cleaned.farms = rows;
    }
    if (src.lab && typeof src.lab === 'object' && !Array.isArray(src.lab)) {
      const lab: Record<string, string> = {};
      ['laboratory', 'certificateNumber', 'testDate', 'status', 'microbiology', 'accuracyRating'].forEach((key) => {
        const t = text((src.lab as Record<string, any>)[key]);
        if (t) lab[key] = t;
      });
      if (Object.keys(lab).length > 0) cleaned.lab = lab;
    }
    return cleaned;
  }

  public async createStoredRecipe(data: CreateRecipeData): Promise<RecipeRecord> {
    const normalized: CreateRecipeData = {
      ...data,
      availableFrom: RecipesService.toDateOrNull(data.availableFrom),
      availableUntil: RecipesService.toDateOrNull(data.availableUntil),
      details: RecipesService.toDetailsOrNull(data.details),
    };
    if ((normalized.isActive ?? true)) {
      await this.assertActiveCapAllows(1);
    }
    const skuCode = (normalized.skuCode || '').trim() || undefined;
    if (skuCode) return this.recipesRepo.create({ ...normalized, skuCode });
    return this.nextAutoSku(normalized.category).then((autoSku) =>
      this.recipesRepo.create({ ...normalized, skuCode: autoSku }),
    );
  }

  private async nextAutoSku(category: string): Promise<string> {
    const prefix = this.skuPrefixFor(category);
    const rows = await this.recipesRepo.list();
    let max = 0;
    for (const row of rows) {
      const match = /^ND-([A-Z]{2})-(\d+)$/.exec(row.skuCode || '');
      if (match && 'ND-' + match[1] === prefix) {
        const num = parseInt(match[2], 10);
        if (num > max) max = num;
      }
    }
    return prefix + '-' + String(max + 1).padStart(3, '0');
  }

  private skuPrefixFor(category: string): string {
    if (category === 'WEIGHT_LOSS_LEAN_SCULPT') return 'ND-WL';
    if (category === 'MUSCLE_GAIN_FIT_BUILD') return 'ND-MG';
    if (category === 'THERAPEUTIC_DIET') return 'ND-TD';
    return 'ND-VT';
  }

  public async updateStoredRecipe(id: string, patch: RecipePatch): Promise<RecipeRecord> {
    const normalized: RecipePatch = { ...patch };
    if ('availableFrom' in normalized) {
      normalized.availableFrom = RecipesService.toDateOrNull(normalized.availableFrom);
    }
    if ('availableUntil' in normalized) {
      normalized.availableUntil = RecipesService.toDateOrNull(normalized.availableUntil);
    }
    if ('details' in normalized) {
      normalized.details = RecipesService.toDetailsOrNull(normalized.details);
    }
    if (normalized.isActive === true) {
      const existing = await this.recipesRepo.findById(id);
      if (!existing) throw new NotFoundException(`Resep dengan ID ${id} tidak ditemukan.`);
      if (!existing.isActive) {
        await this.assertActiveCapAllows(1);
      }
    }
    return this.recipesRepo.update(id, normalized);
  }

  public deleteStoredRecipe(id: string): Promise<void> {
    return this.recipesRepo.remove(id);
  }

  public async importCatalogIntoStore(): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;
    for (const meal of this.catalogMeals) {
      const category = this.mapCatalogCategory(meal.category);
      const seed = this.verifiedMeals.find((v) => v.skuCode === meal.sku);
      const qrVerificationCode = seed?.qrCode || 'ND-VERIFY-' + meal.sku.replace(/^ND-/, '') + '-2026';
      try {
        await this.recipesRepo.create({
          skuCode: meal.sku,
          title: meal.title,
          category,
          calories: meal.calories,
          proteinGrams: meal.proteinG,
          carbsGrams: meal.carbG,
          fatGrams: meal.fatG,
          ingredients: [],
          allergens: [],
          qrVerificationCode,
          imageUrl: meal.imageUrl,
          isActive: meal.isAvailable,
          details: seed ? RecipesService.buildSeedDetails(seed) : null,
        });
        imported++;
      } catch {
        skipped++;
      }
    }
    return { imported, skipped };
  }

  private static buildSeedDetails(seed: VerifiedMealItem): Record<string, any> {
    return {
      batchCode: seed.batchCode,
      ticketNumber: seed.ticketNumber,
      shortTitle: seed.shortTitle,
      imageCaption: seed.imageCaption,
      packagingTimestamp: seed.packagingTimestamp,
      portionWeightGrams: seed.portionWeightGrams,
      toleranceGrams: seed.toleranceGrams,
      fiberGrams: seed.nutritionFacts.fiberGrams,
      sodiumMg: seed.nutritionFacts.sodiumMg,
      glycemicIndex: seed.nutritionFacts.glycemicIndex,
      lab: seed.labCertification,
      farms: seed.ingredientsSourcing,
      grammage: seed.grammage,
      chefNotes: seed.chefNotes,
    };
  }

  /**
   * Mengisi details yang kosong pada baris lama dengan data seed sesuai SKU.
   * Tidak mengubah baris yang sudah punya details.
   */
  public async backfillMissingDetails(): Promise<{ updated: number; skipped: number }> {
    const rows = await this.recipesRepo.list();
    let updated = 0;
    let skipped = 0;
    for (const row of rows) {
      const hasDetails = row.details && typeof row.details === 'object' && Object.keys(row.details).length > 0;
      if (hasDetails) {
        skipped++;
        continue;
      }
      const seed = this.verifiedMeals.find((v) => v.skuCode === row.skuCode);
      if (!seed) {
        skipped++;
        continue;
      }
      await this.recipesRepo.update(row.id, { details: RecipesService.buildSeedDetails(seed) });
      updated++;
    }
    return { updated, skipped };
  }

  private mapCatalogCategory(label: string): string {
    if (label === 'Weight loss') return 'WEIGHT_LOSS_LEAN_SCULPT';
    if (label === 'Muscle gain') return 'MUSCLE_GAIN_FIT_BUILD';
    if (label.indexOf('Therapeutic') === 0) return 'THERAPEUTIC_DIET';
    return 'MAINTENANCE_VITALITY_DAILY';
  }

  private mapStoredCategoryToLabel(code: string): string {
    if (code === 'WEIGHT_LOSS_LEAN_SCULPT') return 'Weight loss';
    if (code === 'MUSCLE_GAIN_FIT_BUILD') return 'Muscle gain';
    if (code === 'THERAPEUTIC_DIET') return 'Therapeutic DASH';
    if (code === 'MAINTENANCE_VITALITY_DAILY') return 'Vitality';
    return code || 'Vitality';
  }

  private mapStoredToMenuItem(row: RecipeRecord): MenuItem {
    return {
      id: row.id,
      sku: row.skuCode,
      title: row.title,
      category: this.mapStoredCategoryToLabel(row.category),
      calories: row.calories,
      proteinG: row.proteinGrams,
      carbG: row.carbsGrams,
      fatG: row.fatGrams,
      cookingMethod: 'Dimasak segar setiap pagi oleh dapur sentral NutriDaily',
      farmerPartner: 'Pasokan petani mitra terverifikasi NutriDaily',
      imageUrl: row.imageUrl || '/images/meals/salmon_meal.jpg',
      isAvailable: true,
      availableFrom: row.availableFrom ? RecipesService.toDateKey(row.availableFrom) : null,
      availableUntil: row.availableUntil ? RecipesService.toDateKey(row.availableUntil) : null,
      availableDays: Array.isArray(row.availableDays) ? row.availableDays : null,
    };
  }

  /**
   * Katalog pelanggan hanya berisi makanan dari database yang boleh dipesan
   * pada minggu tampil. Resep kelolaan admin yang jendelanya cocok tampil
   * paling atas, diurutkan dari biaya bahan termurah.
   */
  public async getCatalog(weekOffset = 0): Promise<{ days: WeeklyDay[]; meals: MenuItem[] }> {
    const days = this.buildWeeklyDays(new Date(), weekOffset);
    const weekStart = days[0].fullDate;
    const weekEnd = days[days.length - 1].fullDate;
    const stored = await this.listStoredRecipes();
    const availableStored = stored
      .filter((row) => row.isActive && RecipesService.weekOverlaps(row, weekStart, weekEnd))
      .sort((a, b) => {
        const costA = a.ingredientCostRp ?? Number.POSITIVE_INFINITY;
        const costB = b.ingredientCostRp ?? Number.POSITIVE_INFINITY;
        return costA - costB;
      })
      .map((row) => this.mapStoredToMenuItem(row));
    return { days, meals: availableStored };
  }

  private mapStoredToVerifiedMeal(row: RecipeRecord): VerifiedMealItem {
    const details = (row.details ?? {}) as Record<string, any>;
    const lab = (details.lab ?? {}) as Record<string, any>;
    return {
      id: row.id,
      skuCode: row.skuCode,
      qrCode: row.qrVerificationCode,
      isActive: row.isActive,
      batchCode: details.batchCode || `BATCH-${row.skuCode}`,
      ticketNumber: details.ticketNumber || 'Tiket produksi dapur sentral',
      shortTitle: details.shortTitle || row.title.split(' ').slice(0, 2).join(' '),
      recipeTitle: row.title,
      category: this.mapStoredCategoryToLabel(row.category),
      portionWeightGrams: details.portionWeightGrams ?? 400,
      toleranceGrams: details.toleranceGrams ?? 4.2,
      imageUrl: row.imageUrl || '/images/meals/salmon_meal.jpg',
      imageCaption: details.imageCaption || 'Dokumentasi boks katering NutriDaily',
      packagingTimestamp: details.packagingTimestamp || 'Dapur Sentral NutriDaily',
      nutritionFacts: {
        calories: row.calories,
        proteinGrams: row.proteinGrams,
        carbsGrams: row.carbsGrams,
        fatGrams: row.fatGrams,
        fiberGrams: details.fiberGrams ?? 5,
        sodiumMg: details.sodiumMg ?? 350,
        glycemicIndex: details.glycemicIndex ?? 50,
      },
      labCertification: {
        laboratory: lab.laboratory || 'Menunggu sertifikasi laboratorium independen',
        certificateNumber: lab.certificateNumber || '-',
        testDate: lab.testDate || '-',
        status: lab.status || 'Dalam antrean uji laboratorium',
        microbiology: lab.microbiology || '-',
        accuracyRating: lab.accuracyRating || '-',
      },
      ingredientsSourcing: details.farms ?? [],
      grammage: details.grammage ?? [],
      chefNotes: details.chefNotes || '',
      allergenWarning: row.allergens ?? [],
    };
  }

  public async getCleanLabelList(): Promise<VerifiedMealItem[]> {
    const rows = await this.listStoredRecipes();
    const activeFirst = rows.slice().sort((a, b) => Number(b.isActive) - Number(a.isActive));
    return activeFirst.map((row) => this.mapStoredToVerifiedMeal(row));
  }

  public async getCleanLabelByCode(code: string): Promise<VerifiedMealItem> {
    const rows = await this.listStoredRecipes();
    const lowered = code.toLowerCase();
    const row = rows.find(
      (r) =>
        r.qrVerificationCode.toLowerCase() === lowered ||
        r.skuCode.toLowerCase() === lowered ||
        r.id.toLowerCase() === lowered,
    );
    if (!row) {
      throw new NotFoundException(`Data Clean Label untuk kode "${code}" tidak ditemukan dalam sistem NutriDaily.`);
    }
    return this.mapStoredToVerifiedMeal(row);
  }
}
