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
  isTomorrow?: boolean;
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
    const tomorrowWib = new Date(wibTime.getTime() + 86400000);
    const tomorrowStr = `${tomorrowWib.getFullYear()}-${String(tomorrowWib.getMonth() + 1).padStart(2, '0')}-${String(tomorrowWib.getDate()).padStart(2, '0')}`;
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
        isTomorrow: fullDate === tomorrowStr,
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
    {
      id: 'm9',
      sku: 'ND-WL-009',
      title: 'Kakap merah kukus jahe serai dengan tumis pokcoy dan beras cokelat',
      category: 'Weight loss',
      calories: 425,
      proteinG: 43,
      carbG: 34,
      fatG: 11,
      cookingMethod: 'Kukus suhu 90°C dengan kaldu jahe emprit dan serai wangi',
      farmerPartner: 'Kakap tangkapan nelayan Muara Baru, beras cokelat Klaten',
      imageUrl: '/images/meals/red_snapper_ginger.jpg',
      isAvailable: true,
    },
    {
      id: 'm10',
      sku: 'ND-WL-010',
      title: 'Tuna sirip kuning panggang lada hitam dengan quinoa dan brokoli kukus',
      category: 'Weight loss',
      calories: 440,
      proteinG: 46,
      carbG: 32,
      fatG: 12,
      cookingMethod: 'Pan-sear api sedang dengan lada hitam Bangka tumbuk kasar',
      farmerPartner: 'Tuna sirip kuning perairan Bali, brokoli organik Lembang',
      imageUrl: '/images/meals/tuna_black_pepper.jpg',
      isAvailable: true,
    },
    {
      id: 'm11',
      sku: 'ND-WL-011',
      title: 'Dada ayam sous-vide rempah lemon dengan ubi panggang paprika',
      category: 'Weight loss',
      calories: 418,
      proteinG: 44,
      carbG: 33,
      fatG: 10,
      cookingMethod: 'Sous-vide pada suhu 64°C selama 60 menit dengan herba segar',
      farmerPartner: 'Ayam probiotik Ciamis, ubi madu Gunung Lawu',
      imageUrl: '/images/meals/chicken_lemon_herb.jpg',
      isAvailable: true,
    },
    {
      id: 'm12',
      sku: 'ND-MG-012',
      title: 'Daging sapi tenderloin panggang rosemary dengan kentang tumbuk bawang putih',
      category: 'Muscle gain',
      calories: 685,
      proteinG: 58,
      carbG: 45,
      fatG: 26,
      cookingMethod: 'Cast iron sear dengan butter organik dan rosemary segar',
      farmerPartner: 'Daging tenderloin peternakan Boyolali, kentang Dieng',
      imageUrl: '/images/meals/beef_tenderloin_mash.jpg',
      isAvailable: true,
    },
    {
      id: 'm13',
      sku: 'ND-MG-013',
      title: 'Paha ayam fillet bakar madu wijen dengan nasi merah pilaf dan wortel baby',
      category: 'Muscle gain',
      calories: 660,
      proteinG: 52,
      carbG: 48,
      fatG: 25,
      cookingMethod: 'Panggang oven rotisserie dengan olesan madu hutan Sumbawa',
      farmerPartner: 'Ayam probiotik Sukabumi, madu liar Sumbawa murni',
      imageUrl: '/images/meals/chicken_honey_sesame.jpg',
      isAvailable: true,
    },
    {
      id: 'm14',
      sku: 'ND-MG-014',
      title: 'Daging sirloin bakar bumbu ketumbar dengan tumis bayam jepang dan nasi jagung',
      category: 'Muscle gain',
      calories: 710,
      proteinG: 55,
      carbG: 46,
      fatG: 30,
      cookingMethod: 'Charcoal grill aroma kayu apel untuk karamelisasi gurih alami',
      farmerPartner: 'Bayam horenso hidroponik Bandung, jagung Madura',
      imageUrl: '/images/meals/sirloin_coriander.jpg',
      isAvailable: true,
    },
    {
      id: 'm15',
      sku: 'ND-TD-015',
      title: 'Fillet kakap putih kukus kemangi dengan tumis labu siam dan shirataki',
      category: 'Therapeutic DASH',
      calories: 460,
      proteinG: 42,
      carbG: 35,
      fatG: 11,
      cookingMethod: 'Kukus bungkus daun pisang dengan aromatik kemangi liar',
      farmerPartner: 'Kakap putih budidaya laut Lampung, labu siam Wonosobo',
      imageUrl: '/images/meals/snapper_kemangi.jpg',
      isAvailable: true,
    },
    {
      id: 'm16',
      sku: 'ND-TD-016',
      title: 'Dada kalkun panggang herba mediterania dengan lentil merah dan brokoli',
      category: 'Therapeutic DASH',
      calories: 472,
      proteinG: 46,
      carbG: 36,
      fatG: 12,
      cookingMethod: 'Slow baked tanpa tambahan garam, kaya kalium dan magnesium',
      farmerPartner: 'Kalkun peternakan lokal Malang, lentil organik impor',
      imageUrl: '/images/meals/turkey_herb_lentils.jpg',
      isAvailable: true,
    },
    {
      id: 'm17',
      sku: 'ND-TD-017',
      title: 'Sup ikan dori bening belimbing wuluh dengan nasi porang dan jamur kuping',
      category: 'Therapeutic DASH',
      calories: 455,
      proteinG: 40,
      carbG: 38,
      fatG: 10,
      cookingMethod: 'Simmer kaldu bening rempah asam belimbing wuluh segar',
      farmerPartner: 'Belimbing wuluh perkebunan Bogor, jamur kuping Cianjur',
      imageUrl: '/images/meals/dory_fish_soup.jpg',
      isAvailable: true,
    },
    {
      id: 'm18',
      sku: 'ND-VT-018',
      title: 'Mangkok poke tempe edamame teriyaki dengan nasi merah dan alpukat',
      category: 'Vitality daily',
      calories: 448,
      proteinG: 33,
      carbG: 45,
      fatG: 14,
      cookingMethod: 'Sauté ringan saus fermentasi kedelai alami tanpa MSG',
      farmerPartner: 'Alpukat mentega perkebunan Garut, edamame Jember',
      imageUrl: '/images/meals/tempeh_poke_bowl.jpg',
      isAvailable: true,
    },
    {
      id: 'm19',
      sku: 'ND-VT-019',
      title: 'Dada ayam panggang bumbu keluwak dengan nasi basmati dan daun singkong muda',
      category: 'Vitality daily',
      calories: 465,
      proteinG: 45,
      carbG: 39,
      fatG: 12,
      cookingMethod: 'Panggang bumbu hitam keluwak rempah rawon kaya antioksidan',
      farmerPartner: 'Keluwak fermentasi hutan Jawa Timur, daun singkong Sukabumi',
      imageUrl: '/images/meals/chicken_keluwak.jpg',
      isAvailable: true,
    },
    {
      id: 'm20',
      sku: 'ND-VT-020',
      title: 'Tahu sutra kukus siram jamur shiitake dengan asparagus dan nasi millet',
      category: 'Vitality daily',
      calories: 420,
      proteinG: 32,
      carbG: 43,
      fatG: 11,
      cookingMethod: 'Kukus lembut dengan kuah reduksi shiitake aromatik jahe',
      farmerPartner: 'Jamur shiitake pegunungan Ciwidey, millet organik Wonogiri',
      imageUrl: '/images/meals/silken_tofu_shiitake.jpg',
      isAvailable: true,
    },
    {
      id: 'm21',
      sku: 'ND-WL-021',
      title: 'Grilled rosemary chicken breast dengan nasi merah dan buncis mini',
      category: 'Weight loss',
      calories: 450,
      proteinG: 42,
      carbG: 45,
      fatG: 11,
      cookingMethod: 'Panggang rosemary dengan minyak zaitun dan bawang putih',
      farmerPartner: 'Ayam probiotik Sukabumi, beras merah Cianjur, buncis Kopeng',
      imageUrl: '/images/meals/chicken_lemon_herb.jpg',
      isAvailable: true,
    },
    {
      id: 'm22',
      sku: 'ND-WL-022',
      title: 'Pan-seared dory with lemon herb dan kembang kol panggang',
      category: 'Weight loss',
      calories: 380,
      proteinG: 35,
      carbG: 25,
      fatG: 14,
      cookingMethod: 'Pan seared dengan perasan lemon dan herba segar',
      farmerPartner: 'Fillet dori Cirebon, kembang kol Lembang, lemon Batu',
      imageUrl: '/images/meals/dory_fish_soup.jpg',
      isAvailable: true,
    },
    {
      id: 'm23',
      sku: 'ND-WL-023',
      title: 'Beef bulgogi shirataki bowl dengan brokoli kukus',
      category: 'Weight loss',
      calories: 470,
      proteinG: 38,
      carbG: 35,
      fatG: 18,
      cookingMethod: 'Tumis bulgogi dengan minyak wijen dan bawang bombai',
      farmerPartner: 'Sirloin Boyolali, shirataki Madiun, brokoli Kopeng',
      imageUrl: '/images/meals/sirloin_coriander.jpg',
      isAvailable: true,
    },
    {
      id: 'm24',
      sku: 'ND-WL-024',
      title: 'Tofu edamame poke salad dengan alpukat',
      category: 'Weight loss',
      calories: 360,
      proteinG: 24,
      carbG: 30,
      fatG: 16,
      cookingMethod: 'Sajian segar dengan dressing yoghurt dan romaine renyah',
      farmerPartner: 'Tahu organik Lembang, edamame Jember, alpukat Garut',
      imageUrl: '/images/meals/tempeh_poke_bowl.jpg',
      isAvailable: true,
    },
    {
      id: 'm25',
      sku: 'ND-WL-025',
      title: 'Nasi ayam bakar bumbu madura dengan nasi cokelat organik',
      category: 'Weight loss',
      calories: 460,
      proteinG: 40,
      carbG: 48,
      fatG: 12,
      cookingMethod: 'Bakar bumbu madura dengan sambal kukus segar',
      farmerPartner: 'Ayam probiotik Sukabumi, beras cokelat Klaten, cabai Ciwidey',
      imageUrl: '/images/meals/chicken_keluwak.jpg',
      isAvailable: true,
    },
    {
      id: 'm26',
      sku: 'ND-WL-026',
      title: 'Herb baked salmon asparagus dengan tomat ceri',
      category: 'Weight loss',
      calories: 420,
      proteinG: 34,
      carbG: 15,
      fatG: 24,
      cookingMethod: 'Panggang herba suhu rendah dengan mentega zaitun',
      farmerPartner: 'Salmon rantai dingin, asparagus Kopeng, tomat Lembang',
      imageUrl: '/images/meals/salmon_meal.jpg',
      isAvailable: true,
    },
    {
      id: 'm27',
      sku: 'ND-WL-027',
      title: 'Mexican chicken burrito bowl dengan quinoa organik',
      category: 'Weight loss',
      calories: 480,
      proteinG: 44,
      carbG: 42,
      fatG: 15,
      cookingMethod: 'Panggang salsa dengan jagung bakar dan guacamole segar',
      farmerPartner: 'Ayam probiotik Sukabumi, quinoa Dieng, kacang merah Grobogan',
      imageUrl: '/images/meals/chicken_honey_sesame.jpg',
      isAvailable: true,
    },
    {
      id: 'm28',
      sku: 'ND-WL-028',
      title: 'Steamed snapper ginger broth dengan shiitake',
      category: 'Weight loss',
      calories: 350,
      proteinG: 36,
      carbG: 20,
      fatG: 8,
      cookingMethod: 'Kukus jahe suhu 90 derajat dengan kaldu bening ringan',
      farmerPartner: 'Kakap putih Lampung, wortel Dieng, shiitake Cianjur',
      imageUrl: '/images/meals/snapper_kemangi.jpg',
      isAvailable: true,
    },
    {
      id: 'm29',
      sku: 'ND-WL-029',
      title: 'Tenderloin steak with mashed sweet potato Cilembu',
      category: 'Weight loss',
      calories: 490,
      proteinG: 41,
      carbG: 40,
      fatG: 16,
      cookingMethod: 'Panggang wajan besi dengan ubi tumbuk lembut',
      farmerPartner: 'Tenderloin Boyolali, ubi Cilembu Sumedang, buncis Dieng',
      imageUrl: '/images/meals/beef_tenderloin_mash.jpg',
      isAvailable: true,
    },
    {
      id: 'm30',
      sku: 'ND-WL-030',
      title: 'Tempeh vegetable pad thai shirataki',
      category: 'Weight loss',
      calories: 370,
      proteinG: 22,
      carbG: 32,
      fatG: 14,
      cookingMethod: 'Tumis asam jawa dengan tauge segar dan tempe bakar',
      farmerPartner: 'Tempe Grobogan, shirataki Madiun, tauge Bogor',
      imageUrl: '/images/meals/silken_tofu_shiitake.jpg',
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
    {
      id: 'kakap-jahe',
      skuCode: 'ND-WL-009',
      qrCode: 'ND-VERIFY-WL-009-2026',
      isActive: true,
      batchCode: '2026-10-07-WL9',
      ticketNumber: 'Tiket produksi dapur #0241',
      shortTitle: 'Kakap merah kukus',
      recipeTitle: 'Kakap merah kukus jahe serai dengan tumis pokcoy dan beras cokelat',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 385,
      toleranceGrams: 4,
      imageUrl: '/images/meals/red_snapper_ginger.jpg',
      imageCaption: 'Dokumentasi boks katering kakap merah kukus sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.15 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 425,
        proteinGrams: 43,
        carbsGrams: 34,
        fatGrams: 11,
        fiberGrams: 6,
        sodiumMg: 340,
        glycemicIndex: 40,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09100-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Kakap merah segar tangkapan lestari',
                origin: 'Muara Baru, Teluk Jakarta (Sertifikasi Kelautan Berkelanjutan)',
                harvestMethod: 'Pengiriman rantai dingin langsung dari pelabuhan tanpa pengawet',
                certifications: [
                        'HACCP Kelautan',
                        'Bebas Formalin'
                ]
        },
        {
                name: 'Beras cokelat organik',
                origin: 'Koperasi Tani Lestari, Klaten, Jawa Tengah',
                harvestMethod: 'Panen tradisional dengan penggilingan sekam minimum',
                certifications: [
                        'SNI Organik Indonesia',
                        'Halal Kemenag'
                ]
        },
        {
                name: 'Pokcoy hidroponik segar',
                origin: 'Perkebunan Sayur Dataran Tinggi Lembang',
                harvestMethod: 'Panen pagi hari bebas pestisida kimia',
                certifications: [
                        'Good Agricultural Practices (GAP)'
                ]
        },
        {
                name: 'Jahe emprit dan serai wangi',
                origin: 'Petani Rempah Dataran Tinggi Boyolali',
                harvestMethod: 'Rempah rimpang segar perasan pertama',
                certifications: [
                        'Non-GMO Verified'
                ]
        }
],
      grammage: [
        {
                label: 'Fillet kakap merah',
                weight: '175 gram'
        },
        {
                label: 'Beras cokelat',
                weight: '115 gram'
        },
        {
                label: 'Pokcoy tumis',
                weight: '70 gram'
        },
        {
                label: 'Kuah jahe serai',
                weight: '25 ml'
        }
],
      chefNotes:
        'Fillet kakap merah dikukus perlahan dengan rempah jahe emprit dan serai wangi untuk mempertahankan kelembutan serat ikan dan cita rasa gurih alami tanpa garam berlebih.',
      allergenWarning: ['Mengandung ikan laut (kakap merah)'],
    },
    {
      id: 'tuna-ladahitam',
      skuCode: 'ND-WL-010',
      qrCode: 'ND-VERIFY-WL-010-2026',
      isActive: true,
      batchCode: '2026-10-07-WL10',
      ticketNumber: 'Tiket produksi dapur #0242',
      shortTitle: 'Tuna lada hitam',
      recipeTitle: 'Tuna sirip kuning panggang lada hitam dengan quinoa dan brokoli kukus',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 390,
      toleranceGrams: 4.2,
      imageUrl: '/images/meals/tuna_black_pepper.jpg',
      imageCaption: 'Dokumentasi boks katering steak tuna lada hitam sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.30 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 440,
        proteinGrams: 46,
        carbsGrams: 32,
        fatGrams: 12,
        fiberGrams: 6.8,
        sodiumMg: 355,
        glycemicIndex: 39,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09101-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Tuna sirip kuning grade A',
                origin: 'Perikanan Tangkap Pancing Ulur Kusamba, Klungkung, Bali',
                harvestMethod: 'Tangkapan ramah lumba-lumba (Dolphin-Safe) rantai beku -18°C',
                certifications: [
                        'Friend of the Sea',
                        'Dolphin Safe'
                ]
        },
        {
                name: 'Quinoa organik tiga warna',
                origin: 'Kemitraan Petani Organik Dataran Tinggi Dieng',
                harvestMethod: 'Budi daya lereng pegunungan bebas herbisida sintetis',
                certifications: [
                        'USDA Organic Certified',
                        'SNI Organik'
                ]
        },
        {
                name: 'Brokoli hijau segar',
                origin: 'Kelompok Tani Puncak Lembang, Jawa Barat',
                harvestMethod: 'Dipetik subuh pada kesegaran pucuk optimal',
                certifications: [
                        'Good Agricultural Practices (GAP)'
                ]
        },
        {
                name: 'Lada hitam butir utuh',
                origin: 'Perkebunan Lada Tradisional Muntok, Bangka',
                harvestMethod: 'Pengeringan sinar matahari alami tanpa pemutih',
                certifications: [
                        'Geographical Indication Bangka'
                ]
        }
],
      grammage: [
        {
                label: 'Steak tuna sirip kuning',
                weight: '180 gram'
        },
        {
                label: 'Quinoa matang',
                weight: '110 gram'
        },
        {
                label: 'Brokoli kukus',
                weight: '75 gram'
        },
        {
                label: 'Saus lada hitam alami',
                weight: '25 ml'
        }
],
      chefNotes:
        'Daging tuna sirip kuning dipanggang cepat agar bagian tengah tetap lembut dan juicy, dilapisi taburan lada hitam Bangka aromatik pembakar metabolisme.',
      allergenWarning: ['Mengandung ikan laut (tuna sirip kuning)'],
    },
    {
      id: 'ayam-lemon',
      skuCode: 'ND-WL-011',
      qrCode: 'ND-VERIFY-WL-011-2026',
      isActive: true,
      batchCode: '2026-10-07-WL11',
      ticketNumber: 'Tiket produksi dapur #0243',
      shortTitle: 'Ayam sous-vide lemon',
      recipeTitle: 'Dada ayam sous-vide rempah lemon dengan ubi panggang paprika',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 380,
      toleranceGrams: 3.8,
      imageUrl: '/images/meals/chicken_lemon_herb.jpg',
      imageCaption: 'Dokumentasi boks katering ayam sous-vide lemon sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.45 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 418,
        proteinGrams: 44,
        carbsGrams: 33,
        fatGrams: 10,
        fiberGrams: 5.5,
        sodiumMg: 330,
        glycemicIndex: 42,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09102-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Dada ayam probiotik tanpa antibiotik',
                origin: 'Peternakan Unggas Alami Panjalu, Ciamis, Jawa Barat',
                harvestMethod: 'Pakan fermentasi herbal jamu tanpa promotor pertumbuhan sintetis',
                certifications: [
                        'NKV Veteriner Nomor 3207',
                        'Halal Kemenag'
                ]
        },
        {
                name: 'Ubi madu organik',
                origin: 'Kelompok Tani Lereng Gunung Lawu, Karanganyar',
                harvestMethod: 'Panen tanah vulkanik subur kaya mineral alami',
                certifications: [
                        'SNI Organik Indonesia'
                ]
        },
        {
                name: 'Paprika merah manis',
                origin: 'Greenhouse Hidroponik Ciwidey, Bandung',
                harvestMethod: 'Pengairan air pegunungan Patuha',
                certifications: [
                        'GAP Jawa Barat'
                ]
        },
        {
                name: 'Lemon lokal tanpa lilin',
                origin: 'Perkebunan Jeruk Dataran Tinggi Batu, Malang',
                harvestMethod: 'Petik pohon matang alami tanpa lapisan pestisida lilin',
                certifications: [
                        'Prima-3 Keamanan Pangan'
                ]
        }
],
      grammage: [
        {
                label: 'Fillet dada ayam',
                weight: '170 gram'
        },
        {
                label: 'Ubi panggang paprika',
                weight: '115 gram'
        },
        {
                label: 'Buncis baby kukus',
                weight: '70 gram'
        },
        {
                label: 'Jus lemon zaitun',
                weight: '25 ml'
        }
],
      chefNotes:
        'Dada ayam diolah sous-vide pada temperatur 64°C presisi tinggi menghasilkan tekstur lembut luar biasa dengan sari kaldu alami yang terkunci sempurna.',
      allergenWarning: ['Bebas gluten','Bebas laktosa','Bebas alergen kacang'],
    },
    {
      id: 'beef-tenderloin',
      skuCode: 'ND-MG-012',
      qrCode: 'ND-VERIFY-MG-012-2026',
      isActive: true,
      batchCode: '2026-10-07-MG12',
      ticketNumber: 'Tiket produksi dapur #0244',
      shortTitle: 'Tenderloin rosemary',
      recipeTitle: 'Daging sapi tenderloin panggang rosemary dengan kentang tumbuk bawang putih',
      category: 'Muscle gain (fit & build)',
      portionWeightGrams: 420,
      toleranceGrams: 4.5,
      imageUrl: '/images/meals/beef_tenderloin_mash.jpg',
      imageCaption: 'Dokumentasi boks katering tenderloin panggang rosemary sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.15 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 685,
        proteinGrams: 58,
        carbsGrams: 45,
        fatGrams: 26,
        fiberGrams: 5.2,
        sodiumMg: 420,
        glycemicIndex: 46,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09103-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Daging tenderloin sapi prime',
                origin: 'Kemitraan Ternak Sapi Perah & Potong Selo, Boyolali',
                harvestMethod: 'Pemotongan bersertifikat RPH Halal higienis dan dry aged 14 hari',
                certifications: [
                        'Sertifikasi Halal MUI',
                        'NKV Daging Nomor 3309'
                ]
        },
        {
                name: 'Kentang granola Dieng',
                origin: 'Koperasi Petani Dataran Tinggi Kejajar, Wonosobo',
                harvestMethod: 'Panen tanah andosol dataran tinggi 2.000 mdpl',
                certifications: [
                        'Prima-2 Keamanan Pangan'
                ]
        },
        {
                name: 'Bawang putih tunggal organik',
                origin: 'Lereng Gunung Sindoro, Temanggung',
                harvestMethod: 'Pengeringan alami dengan angin pegunungan',
                certifications: [
                        'Organik Indonesia'
                ]
        },
        {
                name: 'Rosemary segar',
                origin: 'Kebun Tanaman Herba Organik Cipanas, Puncak',
                harvestMethod: 'Dipetik segar sebelum waktu olah dapur',
                certifications: [
                        'GAP Pertanian'
                ]
        }
],
      grammage: [
        {
                label: 'Steak tenderloin sapi',
                weight: '190 gram'
        },
        {
                label: 'Kentang tumbuk aromatik',
                weight: '140 gram'
        },
        {
                label: 'Wortel baby panggang',
                weight: '65 gram'
        },
        {
                label: 'Saus herba rosemary',
                weight: '25 ml'
        }
],
      chefNotes:
        'Potongan tenderloin sapi pilihan dipanggang di wajan besi panas hingga medium rare karamelisasi crust renyah dengan surplus asam amino pembentuk massa otot.',
      allergenWarning: ['Mengandung daging sapi','Susu sapi (butter organik)'],
    },
    {
      id: 'ayam-madu',
      skuCode: 'ND-MG-013',
      qrCode: 'ND-VERIFY-MG-013-2026',
      isActive: true,
      batchCode: '2026-10-07-MG13',
      ticketNumber: 'Tiket produksi dapur #0245',
      shortTitle: 'Ayam madu wijen',
      recipeTitle: 'Paha ayam fillet bakar madu wijen dengan nasi merah pilaf dan wortel baby',
      category: 'Muscle gain (fit & build)',
      portionWeightGrams: 415,
      toleranceGrams: 4.2,
      imageUrl: '/images/meals/chicken_honey_sesame.jpg',
      imageCaption: 'Dokumentasi boks katering ayam bakar madu wijen sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.30 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 660,
        proteinGrams: 52,
        carbsGrams: 48,
        fatGrams: 25,
        fiberGrams: 6,
        sodiumMg: 410,
        glycemicIndex: 45,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09104-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Paha ayam probiotik fillet',
                origin: 'Peternakan Organik Sukabumi, Jawa Barat',
                harvestMethod: 'Ayam kampung super tanpa suntikan hormon sintetis',
                certifications: [
                        'NKV Nomor 3202',
                        'Halal Kemenag'
                ]
        },
        {
                name: 'Beras merah pulen aromatik',
                origin: 'Koperasi Tani Organik Pakem, Sleman, Yogyakarta',
                harvestMethod: 'Pengairan irigasi mata air Gunung Merapi',
                certifications: [
                        'SNI Organik Indonesia'
                ]
        },
        {
                name: 'Madu hutan liar murni',
                origin: 'Hutan Tropis Sumbawa Barat, Nusa Tenggara Barat',
                harvestMethod: 'Panen lestari sarang lebah Apis dorsata tanpa pemanasan buatan',
                certifications: [
                        'Uji Kemurnian Lab SIG',
                        'P-IRT Dinkes'
                ]
        },
        {
                name: 'Biji wijen putih',
                origin: 'Petani Wijen Tradisional Purworejo',
                harvestMethod: 'Penyangraian temperatur rendah menjaga kadar asam lemak tak jenuh',
                certifications: [
                        'Non-GMO Verified'
                ]
        }
],
      grammage: [
        {
                label: 'Paha ayam fillet',
                weight: '185 gram'
        },
        {
                label: 'Nasi merah pilaf',
                weight: '135 gram'
        },
        {
                label: 'Wortel baby panggang',
                weight: '70 gram'
        },
        {
                label: 'Saus madu wijen',
                weight: '25 ml'
        }
],
      chefNotes:
        'Paha ayam bebas kulit dipanggang rotisserie suhu 190°C dengan karamelisasi madu hutan murni dan taburan biji wijen kaya zinc untuk recovery otot optimal.',
      allergenWarning: ['Mengandung biji wijen'],
    },
    {
      id: 'beef-sirloin',
      skuCode: 'ND-MG-014',
      qrCode: 'ND-VERIFY-MG-014-2026',
      isActive: true,
      batchCode: '2026-10-07-MG14',
      ticketNumber: 'Tiket produksi dapur #0246',
      shortTitle: 'Sirloin bakar ketumbar',
      recipeTitle: 'Daging sirloin bakar bumbu ketumbar dengan tumis bayam jepang dan nasi jagung',
      category: 'Muscle gain (fit & build)',
      portionWeightGrams: 425,
      toleranceGrams: 4.8,
      imageUrl: '/images/meals/sirloin_coriander.jpg',
      imageCaption: 'Dokumentasi boks katering sirloin bakar ketumbar sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.45 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 710,
        proteinGrams: 55,
        carbsGrams: 46,
        fatGrams: 30,
        fiberGrams: 6.5,
        sodiumMg: 435,
        glycemicIndex: 44,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09105-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Daging sapi sirloin marbling prima',
                origin: 'Peternakan Mitra Sentra Ternak Singosari, Malang',
                harvestMethod: 'Sapi potong pakan konsentrat jagung fermentasi alami',
                certifications: [
                        'Halal Indonesia',
                        'NKV Daging Nomor 3507'
                ]
        },
        {
                name: 'Beras jagung pipil kuning',
                origin: 'Kelompok Tani Pangan Tradisional Sumenep, Madura',
                harvestMethod: 'Penggilingan bebas bahan pengawet tepung',
                certifications: [
                        'SNI Pangan Nusantara'
                ]
        },
        {
                name: 'Bayam horenso organik',
                origin: 'Greenhouse Hidroponik Parongpong, Bandung Barat',
                harvestMethod: 'Panen daun muda kaya zat besi dan asam folat',
                certifications: [
                        'Good Agricultural Practices (GAP)'
                ]
        },
        {
                name: 'Biji ketumbar sangrai',
                origin: 'Perkebunan Rempah Rakyat Kulon Progo, DIY',
                harvestMethod: 'Panen tradisional tanpa pewangi buatan',
                certifications: [
                        'Non-GMO Verified'
                ]
        }
],
      grammage: [
        {
                label: 'Sirloin steak bakar',
                weight: '185 gram'
        },
        {
                label: 'Nasi jagung pulen',
                weight: '135 gram'
        },
        {
                label: 'Bayam jepang tumis',
                weight: '75 gram'
        },
        {
                label: 'Sambal ketumbar rempah',
                weight: '30 ml'
        }
],
      chefNotes:
        'Sirloin dipanggang bara arang kelapa dengan marinasi ketumbar sangrai dan bawang putih untuk profil rasa gurih nusantara tinggi zat besi alami.',
      allergenWarning: ['Mengandung daging sapi','Kedelai (minyak wijen)'],
    },
    {
      id: 'kakap-kemangi',
      skuCode: 'ND-TD-015',
      qrCode: 'ND-VERIFY-TD-015-2026',
      isActive: true,
      batchCode: '2026-10-07-TD15',
      ticketNumber: 'Tiket produksi dapur #0247',
      shortTitle: 'Kakap putih kemangi',
      recipeTitle: 'Fillet kakap putih kukus kemangi dengan tumis labu siam dan shirataki',
      category: 'Therapeutic diet (DASH & low GI)',
      portionWeightGrams: 395,
      toleranceGrams: 4,
      imageUrl: '/images/meals/snapper_kemangi.jpg',
      imageCaption: 'Dokumentasi boks katering kakap putih kukus kemangi sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.20 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 460,
        proteinGrams: 42,
        carbsGrams: 35,
        fatGrams: 11,
        fiberGrams: 7.2,
        sodiumMg: 310,
        glycemicIndex: 35,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09106-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Kakap putih laut ramah lingkungan',
                origin: 'Karamba Jaring Apung Teluk Hurun, Pesawaran, Lampung',
                harvestMethod: 'Budi daya sirkulasi air laut alami tanpa kimia sintetis',
                certifications: [
                        'IndoGAP Kelautan',
                        'Bebas Logam Berat Merkuri'
                ]
        },
        {
                name: 'Beras konjac shirataki',
                origin: 'Pabrikasi Olahan Umbi Porang Madiun, Jawa Timur',
                harvestMethod: 'Pengeringan umbi porang alami rendah kalori dan bebas gula',
                certifications: [
                        'BPOM MD',
                        'Halal Kemenag'
                ]
        },
        {
                name: 'Labu siam baby organik',
                origin: 'Petani Dataran Tinggi Garung, Wonosobo',
                harvestMethod: 'Dipetik muda dengan kandungan kalium tinggi pembersih sodium',
                certifications: [
                        'SNI Organik Indonesia'
                ]
        },
        {
                name: 'Daun kemangi liar segar',
                origin: 'Kebun Rempah Organik Cisaat, Sukabumi',
                harvestMethod: 'Petik pucuk segar pagi hari kaya minyak atsiri alami',
                certifications: [
                        'GAP Jawa Barat'
                ]
        }
],
      grammage: [
        {
                label: 'Fillet kakap putih',
                weight: '175 gram'
        },
        {
                label: 'Nasi shirataki porang',
                weight: '125 gram'
        },
        {
                label: 'Labu siam tumis',
                weight: '70 gram'
        },
        {
                label: 'Kuah kaldu kemangi',
                weight: '25 ml'
        }
],
      chefNotes:
        'Dibungkus daun pisang dan dikukus perlahan bersama daun kemangi wangi untuk mereduksi beban natrium sekaligus menjaga stabilitas tekanan darah.',
      allergenWarning: ['Mengandung ikan laut (kakap putih)'],
    },
    {
      id: 'kalkun-herba',
      skuCode: 'ND-TD-016',
      qrCode: 'ND-VERIFY-TD-016-2026',
      isActive: true,
      batchCode: '2026-10-07-TD16',
      ticketNumber: 'Tiket produksi dapur #0248',
      shortTitle: 'Dada kalkun herba',
      recipeTitle: 'Dada kalkun panggang herba mediterania dengan lentil merah dan brokoli',
      category: 'Therapeutic diet (DASH & low GI)',
      portionWeightGrams: 400,
      toleranceGrams: 4.1,
      imageUrl: '/images/meals/turkey_herb_lentils.jpg',
      imageCaption: 'Dokumentasi boks katering dada kalkun herba sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.40 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 472,
        proteinGrams: 46,
        carbsGrams: 36,
        fatGrams: 12,
        fiberGrams: 7.5,
        sodiumMg: 325,
        glycemicIndex: 38,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09107-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Daging kalkun dada rendah lemak',
                origin: 'Peternakan Unggas Sehat Dau, Kabupaten Malang',
                harvestMethod: 'Unggas umbaran bebas kandang baterai pakan jagung alami',
                certifications: [
                        'NKV Unggas Nomor 3508',
                        'Halal MUI'
                ]
        },
        {
                name: 'Lentil merah organik',
                origin: 'Kemitraan Pertanian Pangan Sehat Internasional',
                harvestMethod: 'Biji utuh tanpa pengawet sulfur pemutih',
                certifications: [
                        'Certified Organic EU/USDA',
                        'Non-GMO'
                ]
        },
        {
                name: 'Brokoli baby organik',
                origin: 'Kelompok Tani Tunas Harapan Kopeng, Jawa Tengah',
                harvestMethod: 'Panen embun pagi bebas pestisida',
                certifications: [
                        'SNI Organik Indonesia'
                ]
        },
        {
                name: 'Herba oregano dan thyme segar',
                origin: 'Kebun Tanaman Aromatik Cisarua, Bandung Barat',
                harvestMethod: 'Dipetik segar per batch produksi dapur',
                certifications: [
                        'GAP Jawa Barat'
                ]
        }
],
      grammage: [
        {
                label: 'Fillet dada kalkun',
                weight: '175 gram'
        },
        {
                label: 'Lentil merah rebus',
                weight: '120 gram'
        },
        {
                label: 'Brokoli kukus',
                weight: '80 gram'
        },
        {
                label: 'Minyak zaitun herba',
                weight: '25 ml'
        }
],
      chefNotes:
        'Daging kalkun sangat rendah lemak jenuh dan tinggi triptofan, dipadukan lentil merah kaya folat dan magnesium ramah kesehatan kardiovaskular.',
      allergenWarning: ['Bebas gluten','Bebas laktosa','Bebas alergen kacang tanah'],
    },
    {
      id: 'dori-belimbing',
      skuCode: 'ND-TD-017',
      qrCode: 'ND-VERIFY-TD-017-2026',
      isActive: true,
      batchCode: '2026-10-07-TD17',
      ticketNumber: 'Tiket produksi dapur #0249',
      shortTitle: 'Sup dori belimbing',
      recipeTitle: 'Sup ikan dori bening belimbing wuluh dengan nasi porang dan jamur kuping',
      category: 'Therapeutic diet (DASH & low GI)',
      portionWeightGrams: 390,
      toleranceGrams: 3.9,
      imageUrl: '/images/meals/dory_fish_soup.jpg',
      imageCaption: 'Dokumentasi boks katering sup dori belimbing wuluh sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.00 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 455,
        proteinGrams: 40,
        carbsGrams: 38,
        fatGrams: 10,
        fiberGrams: 7,
        sodiumMg: 295,
        glycemicIndex: 36,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09108-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Ikan dori fillet laut segar',
                origin: 'Perikanan Tangkap Nelayan Pantai Utara Cirebon, Jawa Barat',
                harvestMethod: 'Pendinginan es murni bebas formalin dan bahan pengawet',
                certifications: [
                        'Uji Lab Bebas Formalin',
                        'HACCP Laut'
                ]
        },
        {
                name: 'Beras porang pangan fungsional',
                origin: 'Sentra Tani Porang Rejoso, Nganjuk, Jawa Timur',
                harvestMethod: 'Proses kristalisasi glukomanan murni tinggi serat larut air',
                certifications: [
                        'BPOM RI',
                        'Halal Kemenag'
                ]
        },
        {
                name: 'Jamur kuping hitam segar',
                origin: 'Budi Daya Jamur Kayu Pacet, Cianjur',
                harvestMethod: 'Panen media serbuk kayu alami tanpa pestisida',
                certifications: [
                        'Prima-2 Pertanian'
                ]
        },
        {
                name: 'Belimbing wuluh asam segar',
                origin: 'Perkebunan Buah Rakyat Dramaga, Bogor',
                harvestMethod: 'Dipetik matang segar dari pohon hari yang sama',
                certifications: [
                        'GAP Buah Tropis'
                ]
        }
],
      grammage: [
        {
                label: 'Fillet ikan dori',
                weight: '170 gram'
        },
        {
                label: 'Nasi porang rendah kalori',
                weight: '120 gram'
        },
        {
                label: 'Jamur kuping kuah',
                weight: '75 gram'
        },
        {
                label: 'Kuah asam belimbing wuluh',
                weight: '25 ml'
        }
],
      chefNotes:
        'Kuah kaldu disajikan tanpa garam dapur olahan, menggunakan keasaman alami belimbing wuluh dan rempah serai untuk stimulasi indera pengecap penderita hipertensi.',
      allergenWarning: ['Mengandung ikan laut (dori fillet)'],
    },
    {
      id: 'tempe-teriyaki',
      skuCode: 'ND-VT-018',
      qrCode: 'ND-VERIFY-VT-018-2026',
      isActive: true,
      batchCode: '2026-10-07-VT18',
      ticketNumber: 'Tiket produksi dapur #0250',
      shortTitle: 'Poke tempe edamame',
      recipeTitle: 'Mangkok poke tempe edamame teriyaki dengan nasi merah dan alpukat',
      category: 'Maintenance (vitality daily)',
      portionWeightGrams: 395,
      toleranceGrams: 4,
      imageUrl: '/images/meals/tempeh_poke_bowl.jpg',
      imageCaption: 'Dokumentasi boks katering poke tempe edamame sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.35 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 448,
        proteinGrams: 33,
        carbsGrams: 45,
        fatGrams: 14,
        fiberGrams: 8.5,
        sodiumMg: 360,
        glycemicIndex: 42,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09109-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Kedelai hitam dan kuning non-GMO',
                origin: 'Koperasi Tani Kedelai Lokal Grobogan, Jawa Tengah',
                harvestMethod: 'Fermentasi ragi tradisional daun pisang higienis',
                certifications: [
                        'SNI Tempe Indonesia',
                        'Halal Kemenag'
                ]
        },
        {
                name: 'Alpukat mentega super',
                origin: 'Perkebunan Buah Lereng Gunung Cikuray, Garut',
                harvestMethod: 'Petik pohon tua kaya asam lemak tak jenuh oleat',
                certifications: [
                        'Prima-3 Keamanan Buah'
                ]
        },
        {
                name: 'Edamame jepang kualitas prima',
                origin: 'Petani Mitra Budi Daya Edamame Jember, Jawa Timur',
                harvestMethod: 'Dipetik segar subuh hari dan blansir higienis',
                certifications: [
                        'Global GAP Certified',
                        'Non-GMO'
                ]
        },
        {
                name: 'Beras merah aromatik',
                origin: 'Koperasi Beras Organik Wonogiri, Jawa Tengah',
                harvestMethod: 'Panen tradisional pengairan pegunungan Lawu',
                certifications: [
                        'SNI Organik Indonesia'
                ]
        }
],
      grammage: [
        {
                label: 'Tempe kedelai panggang',
                weight: '130 gram'
        },
        {
                label: 'Nasi merah organik',
                weight: '110 gram'
        },
        {
                label: 'Alpukat iris mentega',
                weight: '60 gram'
        },
        {
                label: 'Edamame rebus',
                weight: '65 gram'
        },
        {
                label: 'Saus teriyaki alami',
                weight: '30 ml'
        }
],
      chefNotes:
        'Kombinasi protein nabati tempe fermentasi tradisional dan edamame segar dengan lemak tak jenuh tunggal alpukat untuk vitalitas stamina harian yang seimbang.',
      allergenWarning: ['Mengandung kedelai (tempe, edamame)'],
    },
    {
      id: 'ayam-keluwak',
      skuCode: 'ND-VT-019',
      qrCode: 'ND-VERIFY-VT-019-2026',
      isActive: true,
      batchCode: '2026-10-07-VT19',
      ticketNumber: 'Tiket produksi dapur #0251',
      shortTitle: 'Ayam panggang keluwak',
      recipeTitle: 'Dada ayam panggang bumbu keluwak dengan nasi basmati dan daun singkong muda',
      category: 'Maintenance (vitality daily)',
      portionWeightGrams: 405,
      toleranceGrams: 4.2,
      imageUrl: '/images/meals/chicken_keluwak.jpg',
      imageCaption: 'Dokumentasi boks katering ayam panggang keluwak sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.10 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 465,
        proteinGrams: 45,
        carbsGrams: 39,
        fatGrams: 12,
        fiberGrams: 6.2,
        sodiumMg: 375,
        glycemicIndex: 45,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09110-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Dada ayam probiotik fillet',
                origin: 'Peternakan Ayam Tanpa Hormon Sukabumi, Jawa Barat',
                harvestMethod: 'Ayam sehat higienis sistem ventilasi kandang tertutup modern',
                certifications: [
                        'NKV Nomor 3202',
                        'Halal Indonesia'
                ]
        },
        {
                name: 'Biji keluwak hutan matang pohon',
                origin: 'Kawasan Hutan Tradisional Kendeng, Ngawi, Jawa Timur',
                harvestMethod: 'Fermentasi abu alami 40 hari penetral glikosida',
                certifications: [
                        'Rempah Nusantara Autentik'
                ]
        },
        {
                name: 'Beras basmati premium',
                origin: 'Pertanian Mitra Rendah Amilosa dan Rendah Gula',
                harvestMethod: 'Padi bulir panjang aged 1 tahun untuk indeks glikemik rendah',
                certifications: [
                        'Non-GMO Verified'
                ]
        },
        {
                name: 'Daun singkong muda organik',
                origin: 'Perkebunan Sayur Daun Hijau Bogor, Jawa Barat',
                harvestMethod: 'Pemetikan hanya pada 3 lembar daun teratas pucuk',
                certifications: [
                        'GAP Jawa Barat'
                ]
        }
],
      grammage: [
        {
                label: 'Dada ayam fillet',
                weight: '175 gram'
        },
        {
                label: 'Nasi basmati rempah',
                weight: '125 gram'
        },
        {
                label: 'Daun singkong muda',
                weight: '75 gram'
        },
        {
                label: 'Bumbu keluwak sangrai',
                weight: '30 ml'
        }
],
      chefNotes:
        'Bumbu hitam keluwak kaya senyawa polifenol antioksidan dipadukan ayam panggang gurih dan daun singkong muda rebus untuk menunjang daya tahan tubuh sepanjang hari kerja.',
      allergenWarning: ['Bebas kacang tanah','Bebas susu sapi','Bebas gluten'],
    },
    {
      id: 'tahu-shiitake',
      skuCode: 'ND-VT-020',
      qrCode: 'ND-VERIFY-VT-020-2026',
      isActive: true,
      batchCode: '2026-10-07-VT20',
      ticketNumber: 'Tiket produksi dapur #0252',
      shortTitle: 'Tahu sutra shiitake',
      recipeTitle: 'Tahu sutra kukus siram jamur shiitake dengan asparagus dan nasi millet',
      category: 'Maintenance (vitality daily)',
      portionWeightGrams: 385,
      toleranceGrams: 3.8,
      imageUrl: '/images/meals/silken_tofu_shiitake.jpg',
      imageCaption: 'Dokumentasi boks katering tahu sutra jamur shiitake sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.25 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 420,
        proteinGrams: 32,
        carbsGrams: 43,
        fatGrams: 11,
        fiberGrams: 7.8,
        sodiumMg: 345,
        glycemicIndex: 41,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09111-ND',
        testDate: '25 September 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
                name: 'Tahu sutra kedelai non-GMO',
                origin: 'Pengrajin Tahu Organik Bersertifikasi Sleman, Yogyakarta',
                harvestMethod: 'Pembuatan segar harian dengan koagulan nigari alami sari air laut',
                certifications: [
                        'Halal Kemenag',
                        'SNI Pangan Organik'
                ]
        },
        {
                name: 'Jamur shiitake segar',
                origin: 'Peternakan Jamur Dataran Tinggi Ciwidey, Bandung Selatan',
                harvestMethod: 'Budi daya batang kayu alami suhu sejuk 18°C',
                certifications: [
                        'GAP Pertanian Ramah Lingkungan'
                ]
        },
        {
                name: 'Biji millet emas organik',
                origin: 'Koperasi Pangan Serealia Nusantara Wonogiri',
                harvestMethod: 'Serealia kuno bebas gluten kaya silika dan zat besi',
                certifications: [
                        'SNI Organik Indonesia'
                ]
        },
        {
                name: 'Asparagus hijau segar',
                origin: 'Perkebunan Sayur Kopeng, Jawa Tengah',
                harvestMethod: 'Petik subuh kualitas ekspor',
                certifications: [
                        'Good Agricultural Practices (GAP)'
                ]
        }
],
      grammage: [
        {
                label: 'Tahu sutra organik',
                weight: '160 gram'
        },
        {
                label: 'Nasi millet campur',
                weight: '115 gram'
        },
        {
                label: 'Jamur shiitake tumis',
                weight: '60 gram'
        },
        {
                label: 'Asparagus hijau',
                weight: '30 gram'
        },
        {
                label: 'Kuah reduksi shiitake',
                weight: '20 ml'
        }
],
      chefNotes:
        'Tahu sutra bertekstur lembut disiram kuah gurih jamur shiitake sarat beta-glukan untuk kesehatan imunitas seluler tubuh yang prima.',
      allergenWarning: ['Mengandung kedelai (tahu sutra)'],
    },
    {
      id: 'ayam-rosemary-wl21',
      skuCode: 'ND-WL-021',
      qrCode: 'ND-VERIFY-WL-021-2026',
      isActive: true,
      batchCode: '2026-10-08-L21',
      ticketNumber: 'Tiket produksi dapur #0248',
      shortTitle: 'Ayam rosemary bakar',
      recipeTitle: 'Grilled rosemary chicken breast dengan nasi merah dan buncis mini',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 400,
      toleranceGrams: 4,
      imageUrl: '/images/meals/chicken_lemon_herb.jpg',
      imageCaption: 'Dokumentasi boks katering ayam rosemary bakar sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.15 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 450,
        proteinGrams: 42,
        carbsGrams: 45,
        fatGrams: 11,
        fiberGrams: 6.5,
        sodiumMg: 320,
        glycemicIndex: 42,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09112-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Dada ayam bakar rosemary',
          origin: 'Peternakan Ayam Probiotik Sukabumi, Jawa Barat',
          harvestMethod: 'Panen 07 Oktober 2026 tanpa antibiotik dan tanpa hormon sintetis',
          certifications: ['NKV Veteriner', 'Halal Kemenag'],
        },
        {
          name: 'Beras merah Cianjur organik',
          origin: 'Koperasi Tani Cianjur Selatan, Jawa Barat',
          harvestMethod: 'Panen tradisional dengan pengeringan sinar matahari',
          certifications: ['SNI Organik Indonesia'],
        },
        {
          name: 'Buncis mini bawang putih',
          origin: 'Kelompok Tani Kopeng, Jawa Tengah',
          harvestMethod: 'Dipetik subuh 07 Oktober 2026 tekstur renyah alami',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Saus jamur tiram segar',
          origin: 'Budi daya jamur Cianjur, Jawa Barat',
          harvestMethod: 'Reduksi kaldu jamur tanpa MSG dan tanpa pengawet',
          certifications: ['Pangan Segar Aman'],
        },
      ],
      grammage: [
        { label: 'Dada ayam bakar', weight: '180 gram' },
        { label: 'Nasi merah Cianjur', weight: '120 gram' },
        { label: 'Buncis mini bawang putih', weight: '70 gram' },
        { label: 'Saus jamur', weight: '30 ml' },
      ],
      chefNotes:
        'Dada ayam dimarinasi rosemary segar lalu dipanggang perlahan agar sari tetap terkunci. Nasi merah Cianjur pulen menjadi pasangan karbo kompleks yang mengenyangkan.',
      allergenWarning: ['Bebas gluten', 'Bebas susu sapi'],
    },
    {
      id: 'dori-lemon-wl22',
      skuCode: 'ND-WL-022',
      qrCode: 'ND-VERIFY-WL-022-2026',
      isActive: true,
      batchCode: '2026-10-08-L22',
      ticketNumber: 'Tiket produksi dapur #0249',
      shortTitle: 'Dori lemon herba',
      recipeTitle: 'Pan-seared dory with lemon herb dan kembang kol panggang',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 385,
      toleranceGrams: 4,
      imageUrl: '/images/meals/dory_fish_soup.jpg',
      imageCaption: 'Dokumentasi boks katering dori lemon herba sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.30 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 380,
        proteinGrams: 35,
        carbsGrams: 25,
        fatGrams: 14,
        fiberGrams: 5.8,
        sodiumMg: 300,
        glycemicIndex: 38,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09113-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Fillet ikan dori segar',
          origin: 'Perikanan Tangkap Pantai Utara Cirebon, Jawa Barat',
          harvestMethod: 'Pendinginan es murni bebas formalin dan bebas pengawet',
          certifications: ['HACCP Laut', 'Bebas Formalin'],
        },
        {
          name: 'Kembang kol panggang organik',
          origin: 'Petani Organik Lembang, Jawa Barat',
          harvestMethod: 'Panen 07 Oktober 2026 alternatif karbo rendah GI',
          certifications: ['Bebas Pestisida Kimia'],
        },
        {
          name: 'Salad pelangi segar',
          origin: 'Greenhouse Hidroponik Bandung, Jawa Barat',
          harvestMethod: 'Dipanen pagi hari dengan air baku mata air pegunungan',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Lemon lokal tanpa lilin',
          origin: 'Perkebunan Jeruk Batu, Malang, Jawa Timur',
          harvestMethod: 'Petik pohon matang alami tanpa lapisan lilin',
          certifications: ['Prima-3 Keamanan Pangan'],
        },
      ],
      grammage: [
        { label: 'Fillet ikan dori', weight: '175 gram' },
        { label: 'Kembang kol panggang', weight: '110 gram' },
        { label: 'Salad pelangi', weight: '70 gram' },
        { label: 'Saus lemon herba', weight: '30 ml' },
      ],
      chefNotes:
        'Fillet dori dimasak pan seared cepat agar bagian luar gurih dan bagian dalam tetap lembut. Perasan lemon segar menjaga aroma ringan yang cocok untuk defisit kalori.',
      allergenWarning: ['Mengandung ikan laut (dori)'],
    },
    {
      id: 'bulgogi-shirataki-wl23',
      skuCode: 'ND-WL-023',
      qrCode: 'ND-VERIFY-WL-023-2026',
      isActive: true,
      batchCode: '2026-10-08-L23',
      ticketNumber: 'Tiket produksi dapur #0250',
      shortTitle: 'Bulgogi shirataki bowl',
      recipeTitle: 'Beef bulgogi shirataki bowl dengan brokoli kukus',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 410,
      toleranceGrams: 4,
      imageUrl: '/images/meals/sirloin_coriander.jpg',
      imageCaption: 'Dokumentasi boks katering bulgogi shirataki bowl sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 06.45 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 470,
        proteinGrams: 38,
        carbsGrams: 35,
        fatGrams: 18,
        fiberGrams: 6.2,
        sodiumMg: 380,
        glycemicIndex: 44,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09114-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Sirloin rendah lemak iris tipis',
          origin: 'Peternakan Mitra Singosari, Malang, Jawa Timur',
          harvestMethod: 'Pemotongan RPH halal higienis dengan lemak dipangkas bersih',
          certifications: ['Halal Indonesia', 'NKV Daging'],
        },
        {
          name: 'Mi shirataki porang',
          origin: 'Sentra Olahan Porang Madiun, Jawa Timur',
          harvestMethod: 'Olahan umbi porang rendah kalori dan bebas gula',
          certifications: ['BPOM RI', 'Halal Kemenag'],
        },
        {
          name: 'Brokoli kukus segar',
          origin: 'Kelompok Tani Lembang, Jawa Barat',
          harvestMethod: 'Dipetik subuh pada kesegaran pucuk optimal',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Wijen sangrai',
          origin: 'Petani Wijen Purworejo, Jawa Tengah',
          harvestMethod: 'Sangrai suhu rendah menjaga aroma gurih alami',
          certifications: ['Non-GMO Verified'],
        },
      ],
      grammage: [
        { label: 'Sirloin bulgogi', weight: '150 gram' },
        { label: 'Mi shirataki', weight: '120 gram' },
        { label: 'Brokoli kukus', weight: '75 gram' },
        { label: 'Tabur wijen sangrai', weight: '10 gram' },
      ],
      chefNotes:
        'Irisan sirloin dimarinasi bumbu bulgogi rendah gula lalu ditumis cepat agar tetap juicy. Mi shirataki memberi volume kenyang dengan kalori rendah.',
      allergenWarning: ['Mengandung daging sapi', 'Mengandung biji wijen'],
    },
    {
      id: 'tofu-poke-wl24',
      skuCode: 'ND-WL-024',
      qrCode: 'ND-VERIFY-WL-024-2026',
      isActive: true,
      batchCode: '2026-10-08-L24',
      ticketNumber: 'Tiket produksi dapur #0251',
      shortTitle: 'Tofu poke alpukat',
      recipeTitle: 'Tofu edamame poke salad dengan alpukat',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 380,
      toleranceGrams: 4,
      imageUrl: '/images/meals/tempeh_poke_bowl.jpg',
      imageCaption: 'Dokumentasi boks katering tofu poke alpukat sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.00 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 360,
        proteinGrams: 24,
        carbsGrams: 30,
        fatGrams: 16,
        fiberGrams: 8.5,
        sodiumMg: 260,
        glycemicIndex: 34,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09115-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Tahu organik padat',
          origin: 'Sentra Tahu Lembang, Jawa Barat',
          harvestMethod: 'Produksi harian tanpa pengawet dan tanpa tawas',
          certifications: ['Halal Kemenag', 'Bebas Pengawet Kimia'],
        },
        {
          name: 'Edamame segar',
          origin: 'Petani Mitra Jember, Jawa Timur',
          harvestMethod: 'Dipetik segar subuh hari dan direbus higienis',
          certifications: ['Global GAP Certified'],
        },
        {
          name: 'Alpukat mentega',
          origin: 'Perkebunan Cikuray Garut, Jawa Barat',
          harvestMethod: 'Petik pohon tua kaya lemak tak jenuh alami',
          certifications: ['Prima-3 Keamanan Buah'],
        },
        {
          name: 'Romaine segar',
          origin: 'Greenhouse Parongpong, Bandung Barat',
          harvestMethod: 'Panen daun muda renyah bebas pestisida',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
      ],
      grammage: [
        { label: 'Tahu organik panggang', weight: '130 gram' },
        { label: 'Edamame rebus', weight: '70 gram' },
        { label: 'Alpukat iris', weight: '60 gram' },
        { label: 'Romaine dan yoghurt dressing', weight: '90 gram' },
      ],
      chefNotes:
        'Poke disajikan segar tanpa pemanasan ulang untuk menjaga tekstur renyah. Dressing yoghurt rendah lemak memberi rasa creamy tanpa kalori berlebih.',
      allergenWarning: ['Mengandung kedelai (tahu, edamame)', 'Mengandung susu (yoghurt)'],
    },
    {
      id: 'ayam-madura-wl25',
      skuCode: 'ND-WL-025',
      qrCode: 'ND-VERIFY-WL-025-2026',
      isActive: true,
      batchCode: '2026-10-08-L25',
      ticketNumber: 'Tiket produksi dapur #0252',
      shortTitle: 'Ayam bumbu madura',
      recipeTitle: 'Nasi ayam bakar bumbu madura dengan nasi cokelat organik',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 405,
      toleranceGrams: 4,
      imageUrl: '/images/meals/chicken_keluwak.jpg',
      imageCaption: 'Dokumentasi boks katering ayam bumbu madura sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.10 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 460,
        proteinGrams: 40,
        carbsGrams: 48,
        fatGrams: 12,
        fiberGrams: 7,
        sodiumMg: 340,
        glycemicIndex: 43,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09116-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Dada ayam rempah hitam',
          origin: 'Peternakan Ayam Sukabumi, Jawa Barat',
          harvestMethod: 'Ayam sehat tanpa suntik hormon dengan pakan jagung alami',
          certifications: ['NKV Veteriner', 'Halal Indonesia'],
        },
        {
          name: 'Beras cokelat organik',
          origin: 'Koperasi Tani Klaten, Jawa Tengah',
          harvestMethod: 'Giling sekam minimum mempertahankan lapisan bekatul',
          certifications: ['SNI Organik Indonesia'],
        },
        {
          name: 'Cabai rawit dan bawang sambal kukus',
          origin: 'Perkebunan Ciwidey, Jawa Barat',
          harvestMethod: 'Panen segar 07 Oktober 2026 dikukus tanpa minyak berlebih',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Rempah madura sangrai',
          origin: 'Pasar Rempah Sumenep, Madura, Jawa Timur',
          harvestMethod: 'Sangrai tradisional tanpa pewarna dan tanpa MSG',
          certifications: ['Rempah Nusantara Autentik'],
        },
      ],
      grammage: [
        { label: 'Dada ayam bakar madura', weight: '175 gram' },
        { label: 'Nasi cokelat organik', weight: '125 gram' },
        { label: 'Lalapan segar', weight: '60 gram' },
        { label: 'Sambal kukus', weight: '30 ml' },
      ],
      chefNotes:
        'Bumbu madura diracik dari rempah sangrai dengan rasa manis gurih seimbang. Sambal disajikan kukus agar ringan dan tetap ramah untuk program defisit kalori.',
      allergenWarning: ['Bebas kacang tanah', 'Bebas susu sapi'],
    },
    {
      id: 'salmon-asparagus-wl26',
      skuCode: 'ND-WL-026',
      qrCode: 'ND-VERIFY-WL-026-2026',
      isActive: true,
      batchCode: '2026-10-08-L26',
      ticketNumber: 'Tiket produksi dapur #0253',
      shortTitle: 'Salmon asparagus herba',
      recipeTitle: 'Herb baked salmon asparagus dengan tomat ceri',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 390,
      toleranceGrams: 4,
      imageUrl: '/images/meals/salmon_meal.jpg',
      imageCaption: 'Dokumentasi boks katering salmon asparagus herba sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.15 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 420,
        proteinGrams: 34,
        carbsGrams: 15,
        fatGrams: 24,
        fiberGrams: 5.2,
        sodiumMg: 310,
        glycemicIndex: 36,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09117-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Salmon Norwegia fillet herba',
          origin: 'Fjord Barat Norwegia rantai dingin 0 sampai 2 derajat',
          harvestMethod: 'Pengiriman cepat tanpa pembekuan berulang',
          certifications: ['ASC Certified', 'BAP 4-Star'],
        },
        {
          name: 'Asparagus hijau segar',
          origin: 'Kelompok Tani Kopeng, Jawa Tengah',
          harvestMethod: 'Dipetik subuh 07 Oktober 2026 kualitas ekspor',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Mentega zaitun',
          origin: 'Olahan Dapur Sentral Sudirman, Jakarta',
          harvestMethod: 'Campur minyak zaitun perasan dingin dan herba segar',
          certifications: ['Non-GMO Verified'],
        },
        {
          name: 'Tomat ceri organik',
          origin: 'Greenhouse Lembang, Jawa Barat',
          harvestMethod: 'Panen merah pohon kaya likopen alami',
          certifications: ['Bebas Pestisida Kimia'],
        },
      ],
      grammage: [
        { label: 'Salmon panggang herba', weight: '180 gram' },
        { label: 'Asparagus panggang', weight: '80 gram' },
        { label: 'Tomat ceri panggang', weight: '60 gram' },
        { label: 'Oles mentega zaitun', weight: '20 ml' },
      ],
      chefNotes:
        'Salmon dipanggang suhu rendah dengan herba segar agar omega 3 tetap terjaga. Asparagus dan tomat ceri memberi serat dan warna segar dalam satu boks.',
      allergenWarning: ['Mengandung ikan laut (salmon)', 'Mengandung susu (mentega)'],
    },
    {
      id: 'burrito-quinoa-wl27',
      skuCode: 'ND-WL-027',
      qrCode: 'ND-VERIFY-WL-027-2026',
      isActive: true,
      batchCode: '2026-10-08-L27',
      ticketNumber: 'Tiket produksi dapur #0254',
      shortTitle: 'Burrito bowl quinoa',
      recipeTitle: 'Mexican chicken burrito bowl dengan quinoa organik',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 415,
      toleranceGrams: 4,
      imageUrl: '/images/meals/chicken_honey_sesame.jpg',
      imageCaption: 'Dokumentasi boks katering burrito bowl quinoa sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.25 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 480,
        proteinGrams: 44,
        carbsGrams: 42,
        fatGrams: 15,
        fiberGrams: 7.8,
        sodiumMg: 360,
        glycemicIndex: 45,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09118-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Dada ayam salsa',
          origin: 'Peternakan Probiotik Sukabumi, Jawa Barat',
          harvestMethod: 'Marinasi salsa tomat segar 8 jam tanpa pengawet',
          certifications: ['Halal Kemenag', 'NKV Bebas Antibiotik'],
        },
        {
          name: 'Quinoa organik',
          origin: 'Kemitraan Tani Dieng, Jawa Tengah',
          harvestMethod: 'Budi daya lereng pegunungan bebas herbisida sintetis',
          certifications: ['SNI Organik Indonesia'],
        },
        {
          name: 'Kacang merah dan jagung bakar',
          origin: 'Koperasi Tani Grobogan dan Boyolali, Jawa Tengah',
          harvestMethod: 'Rebus dan bakar tanpa minyak berlebih',
          certifications: ['Good Agricultural Practices (GAP)'],
        },
        {
          name: 'Alpukat guacamole',
          origin: 'Perkebunan Garut, Jawa Barat',
          harvestMethod: 'Tumbuk segar dengan perasan jeruk nipis alami',
          certifications: ['Prima-3 Keamanan Buah'],
        },
      ],
      grammage: [
        { label: 'Ayam salsa panggang', weight: '170 gram' },
        { label: 'Quinoa matang', weight: '120 gram' },
        { label: 'Kacang merah dan jagung', weight: '80 gram' },
        { label: 'Guacamole segar', weight: '45 gram' },
      ],
      chefNotes:
        'Bowl ala Meksiko ini padat protein dengan quinoa pulen dan kacang merah berserat. Guacamole dibuat segar setiap pagi tanpa pengawet.',
      allergenWarning: ['Bebas gluten', 'Bebas susu sapi'],
    },
    {
      id: 'snapper-ginger-wl28',
      skuCode: 'ND-WL-028',
      qrCode: 'ND-VERIFY-WL-028-2026',
      isActive: true,
      batchCode: '2026-10-08-L28',
      ticketNumber: 'Tiket produksi dapur #0255',
      shortTitle: 'Snapper kuah jahe',
      recipeTitle: 'Steamed snapper ginger broth dengan shiitake',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 380,
      toleranceGrams: 4,
      imageUrl: '/images/meals/snapper_kemangi.jpg',
      imageCaption: 'Dokumentasi boks katering snapper kuah jahe sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.35 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 350,
        proteinGrams: 36,
        carbsGrams: 20,
        fatGrams: 8,
        fiberGrams: 5,
        sodiumMg: 240,
        glycemicIndex: 32,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09119-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Kakap putih kukus',
          origin: 'Karamba Teluk Hurun Lampung',
          harvestMethod: 'Budi daya air laut alami tanpa kimia sintetis',
          certifications: ['IndoGAP Kelautan', 'Bebas Merkuri'],
        },
        {
          name: 'Jahe emprit segar',
          origin: 'Petani Rempah Boyolali, Jawa Tengah',
          harvestMethod: 'Rimpang segar perasan pertama untuk kaldu bening',
          certifications: ['Non-GMO Verified'],
        },
        {
          name: 'Wortel baby organik',
          origin: 'Dataran Tinggi Dieng, Jawa Tengah',
          harvestMethod: 'Panen muda manis alami kaya beta karoten',
          certifications: ['SNI Organik Indonesia'],
        },
        {
          name: 'Shiitake segar',
          origin: 'Budi daya jamur Pacet Cianjur, Jawa Barat',
          harvestMethod: 'Panen media kayu alami tanpa pestisida',
          certifications: ['Prima-2 Pertanian'],
        },
      ],
      grammage: [
        { label: 'Fillet kakap putih', weight: '175 gram' },
        { label: 'Kuah jahe bening', weight: '80 ml' },
        { label: 'Wortel baby kukus', weight: '65 gram' },
        { label: 'Shiitake iris', weight: '60 gram' },
      ],
      chefNotes:
        'Kakap dikukus dengan jahe hangat sehingga aroma segar dan tekstur lembut. Kuah bening rendah natrium cocok untuk makan malam ringan.',
      allergenWarning: ['Mengandung ikan laut (kakap putih)'],
    },
    {
      id: 'tenderloin-cilembu-wl29',
      skuCode: 'ND-WL-029',
      qrCode: 'ND-VERIFY-WL-029-2026',
      isActive: true,
      batchCode: '2026-10-08-L29',
      ticketNumber: 'Tiket produksi dapur #0256',
      shortTitle: 'Tenderloin ubi Cilembu',
      recipeTitle: 'Tenderloin steak with mashed sweet potato Cilembu',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 420,
      toleranceGrams: 4,
      imageUrl: '/images/meals/beef_tenderloin_mash.jpg',
      imageCaption: 'Dokumentasi boks katering tenderloin ubi Cilembu sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 07.45 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 490,
        proteinGrams: 41,
        carbsGrams: 40,
        fatGrams: 16,
        fiberGrams: 6,
        sodiumMg: 420,
        glycemicIndex: 46,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09120-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Tenderloin panggang',
          origin: 'Kemitraan Ternak Selo Boyolali, Jawa Tengah',
          harvestMethod: 'Pemotongan RPH halal higienis dry aged 14 hari',
          certifications: ['Sertifikasi Halal MUI', 'NKV Daging'],
        },
        {
          name: 'Ubi Cilembu tumbuk',
          origin: 'Petani Ubi Cilembu Sumedang, Jawa Barat',
          harvestMethod: 'Panggang madu alami lalu ditumbuk lembut',
          certifications: ['Prima-2 Keamanan Pangan'],
        },
        {
          name: 'Buncis baby kukus',
          origin: 'Kelompok Tani Dieng, Jawa Tengah',
          harvestMethod: 'Dipetik 07 Oktober 2026 pukul 04.00 WIB',
          certifications: ['SNI Organik Indonesia'],
        },
        {
          name: 'Bawang putih panggang',
          origin: 'Lereng Sindoro Temanggung, Jawa Tengah',
          harvestMethod: 'Panggang utuh untuk aroma manis alami',
          certifications: ['Organik Indonesia'],
        },
      ],
      grammage: [
        { label: 'Tenderloin panggang', weight: '160 gram' },
        { label: 'Ubi Cilembu tumbuk', weight: '130 gram' },
        { label: 'Buncis kukus', weight: '70 gram' },
        { label: 'Jus daging alami', weight: '30 ml' },
      ],
      chefNotes:
        'Tenderloin dipanggang medium dengan crust karamel tipis dan bagian dalam juicy. Ubi Cilembu tumbuk memberi rasa manis alami tanpa gula tambahan.',
      allergenWarning: ['Mengandung daging sapi'],
    },
    {
      id: 'padthai-shirataki-wl30',
      skuCode: 'ND-WL-030',
      qrCode: 'ND-VERIFY-WL-030-2026',
      isActive: true,
      batchCode: '2026-10-08-L30',
      ticketNumber: 'Tiket produksi dapur #0257',
      shortTitle: 'Pad thai shirataki',
      recipeTitle: 'Tempeh vegetable pad thai shirataki',
      category: 'Weight loss (lean & sculpt)',
      portionWeightGrams: 385,
      toleranceGrams: 4,
      imageUrl: '/images/meals/silken_tofu_shiitake.jpg',
      imageCaption: 'Dokumentasi boks katering pad thai shirataki sebelum segel dikunci (Dapur Sudirman)',
      packagingTimestamp: 'Hari ini, 08.00 WIB (Dapur Sentral Sudirman)',
      nutritionFacts: {
        calories: 370,
        proteinGrams: 22,
        carbsGrams: 32,
        fatGrams: 14,
        fiberGrams: 8.2,
        sodiumMg: 290,
        glycemicIndex: 39,
      },
      labCertification: {
        laboratory: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
        certificateNumber: 'SIG-LAB/2026/09121-ND',
        testDate: '4 Oktober 2026',
        status: 'Terverifikasi bebas residu pestisida, logam berat merkuri, dan formalin',
        microbiology: 'Uji Salmonella sp dan E. coli dinyatakan negatif',
        accuracyRating: 'Presisi gramatur lab 99.6%',
      },
      ingredientsSourcing: [
        {
          name: 'Tempe lokal bakar',
          origin: 'Koperasi Kedelai Grobogan, Jawa Tengah',
          harvestMethod: 'Fermentasi ragi tradisional daun pisang higienis',
          certifications: ['SNI Tempe Indonesia', 'Halal Kemenag'],
        },
        {
          name: 'Kwetiau shirataki',
          origin: 'Sentra Porang Nganjuk, Jawa Timur',
          harvestMethod: 'Proses glukomanan murni tinggi serat larut air',
          certifications: ['BPOM RI', 'Halal Kemenag'],
        },
        {
          name: 'Tauge segar',
          origin: 'Petani Kecambah Bogor, Jawa Barat',
          harvestMethod: 'Panen harian tanpa pemutih dan tanpa pengawet',
          certifications: ['Pangan Segar Aman'],
        },
        {
          name: 'Asam jawa asli',
          origin: 'Perkebunan Rakyat Klaten, Jawa Tengah',
          harvestMethod: 'Peras buah matang pohon tanpa pewarna buatan',
          certifications: ['Non-GMO Verified'],
        },
      ],
      grammage: [
        { label: 'Tempe bakar iris', weight: '110 gram' },
        { label: 'Kwetiau shirataki', weight: '120 gram' },
        { label: 'Tauge dan sayur', weight: '80 gram' },
        { label: 'Saus asam jawa', weight: '35 ml' },
      ],
      chefNotes:
        'Pad thai versi ringan ini memakai kwetiau shirataki rendah kalori dengan saus asam jawa segar. Tempe bakar memberi protein nabati yang mengenyangkan.',
      allergenWarning: ['Mengandung kedelai (tempe)'],
    },
  ];

  constructor(@Inject(RECIPES_REPOSITORY) private readonly recipesRepo: RecipesRepository) {}

  public static readonly ACTIVE_MEAL_CAP = 30;
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
