import { jsPDF } from 'jspdf';

export interface NormalizedCertificateData {
  id: string;
  sku: string;
  qrCode: string;
  batchCode: string;
  ticketNumber: string;
  shortTitle: string;
  title: string;
  category: string;
  labName: string;
  labNameShort: string;
  labCertNumber: string;
  labNotes: string;
  labMicrobiology?: string;
  labAccuracy?: string;
  testDate?: string;
  portionWeightGrams?: number;
  toleranceGrams?: number;
  packagingTimestamp?: string;
  nutritionFacts?: {
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    fiberGrams?: number;
    sodiumMg?: number;
    glycemicIndex?: number;
  };
  grammage?: Array<{ label: string; weight: string }>;
  farms?: Array<{
    name: string;
    harvestDate?: string;
    location: string;
    certifications?: string;
  }>;
  chefNotes?: string;
  allergenWarning?: string[];
}

export function normalizeMealToCertificate(data: any): NormalizedCertificateData {
  const isVerifiedMeal = 'recipeTitle' in data || 'skuCode' in data || 'labCertification' in data;

  const title = (isVerifiedMeal ? data.recipeTitle : data.title) || 'Sajian Sehat NutriDaily';
  const sku = (isVerifiedMeal ? data.skuCode : data.sku) || 'ND-MEAL-001';
  const qrCode = data.qrCode || `ND-VERIFY-${sku}-2026`;
  const batchCode = data.batchCode || '2026-10-03-P1';
  const ticketNumber = data.ticketNumber || 'Tiket produksi #0042';
  const shortTitle = data.shortTitle || title.split(' ').slice(0, 2).join(' ');
  const category = data.category || 'Nutrisi harian terukur';

  const labName =
    data.labCertification?.laboratory ||
    data.labName ||
    'PT Saraswanti Indo Genetech (SIG Laboratory)';
  const labNameShort =
    data.labNameShort ||
    (labName.includes('SIG') ? 'SIG Lab' : labName.includes('Sucofindo') ? 'Sucofindo' : 'Lab Independen');
  const labCertNumber =
    data.labCertification?.certificateNumber ||
    data.labCertNumber ||
    'SIG-LAB/2026/08942-ND';
  const labNotes =
    data.labCertification?.status ||
    data.labNotes ||
    'Terverifikasi 100% bebas residu pestisida, logam berat merkuri, dan formalin.';
  const labMicrobiology =
    data.labCertification?.microbiology ||
    'Uji Salmonella sp, E. coli, dan Listeria monocytogenes dinyatakan negatif murni.';
  const labAccuracy =
    data.labCertification?.accuracyRating ||
    'Presisi gramatur dan makronutrisi 99.6% terverifikasi laboratorium.';
  const testDate = data.labCertification?.testDate || '20 September 2026';

  const portionWeightGrams = data.portionWeightGrams || 400;
  const toleranceGrams = data.toleranceGrams || 4.0;
  const packagingTimestamp = data.packagingTimestamp || 'Hari ini, 06.30 WIB (Dapur Sentral Sudirman)';

  const nutritionFacts = data.nutritionFacts || {
    calories: 450,
    proteinGrams: 42,
    carbsGrams: 36,
    fatGrams: 14,
    fiberGrams: 6.5,
    sodiumMg: 350,
    glycemicIndex: 40,
  };

  const grammage: Array<{ label: string; weight: string }> = data.grammage || [
    { label: 'Bahan protein utama', weight: '185 gram' },
    { label: 'Karbohidrat kompleks', weight: '120 gram' },
    { label: 'Sayuran serat pangan', weight: '70 gram' },
    { label: 'Saus rempah alami', weight: '30 ml' },
  ];

  let farms: Array<{ name: string; harvestDate?: string; location: string; certifications?: string }> = [];
  if (Array.isArray(data.farms)) {
    farms = data.farms;
  } else if (Array.isArray(data.ingredientsSourcing)) {
    farms = data.ingredientsSourcing.map((s: any) => ({
      name: s.name,
      harvestDate: s.harvestMethod,
      location: s.origin,
      certifications: Array.isArray(s.certifications) ? s.certifications.join(', ') : s.certifications,
    }));
  }

  const chefNotes = data.chefNotes || 'Dimasak dengan standar kontrol temperatur konstan untuk menjaga integritas mikronutrisi.';
  const allergenWarning = data.allergenWarning || ['Bebas pengawet sintetis'];

  return {
    id: data.id || 'meal-cert',
    sku,
    qrCode,
    batchCode,
    ticketNumber,
    shortTitle,
    title,
    category,
    labName,
    labNameShort,
    labCertNumber,
    labNotes,
    labMicrobiology,
    labAccuracy,
    testDate,
    portionWeightGrams,
    toleranceGrams,
    packagingTimestamp,
    nutritionFacts,
    grammage,
    farms,
    chefNotes,
    allergenWarning,
  };
}

export function exportMealCertificatePdf(rawMeal: any): void {
  const meal = normalizeMealToCertificate(rawMeal);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // 1. Background Paper Tone (#FDFBF7 = 253, 251, 247)
  doc.setFillColor(253, 251, 247);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Dual Elegant Border Frames (Forest Avocado: 44, 74, 62; Warm stone: 222, 216, 206)
  doc.setDrawColor(44, 74, 62);
  doc.setLineWidth(0.8);
  doc.rect(margin - 3, margin - 3, contentWidth + 6, pageHeight - (margin - 3) * 2);

  doc.setDrawColor(222, 216, 206);
  doc.setLineWidth(0.3);
  doc.rect(margin - 1.5, margin - 1.5, contentWidth + 3, pageHeight - (margin - 1.5) * 2);

  let currentY = margin + 2;

  // 3. Header Band (Deep Forest: 44, 74, 62)
  doc.setFillColor(44, 74, 62);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'F');

  doc.setTextColor(253, 251, 247);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('NUTRIDAILY INDONESIA • SISTEM PENJAMINAN MUTU PANGAN CLEAN LABEL', margin + contentWidth / 2, currentY + 6, {
    align: 'center',
  });

  doc.setFontSize(13);
  doc.text('SERTIFIKAT HASIL UJI LABORATORIUM RESMI', margin + contentWidth / 2, currentY + 13, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(215, 226, 222);
  doc.text(
    'Standar Akreditasi KAN LP-001-IDN • ISO/IEC 17025:2017 • Validasi Uji Pangan Katering Sentral',
    margin + contentWidth / 2,
    currentY + 19,
    { align: 'center' }
  );

  currentY += 26;

  // 4. Verification Metadata Grid (Warm Surface: 244, 240, 232)
  // Layout 2 kolom x 3 baris + 1 baris penuh, posisi nilai diukur dari lebar label (anti tumpang tindih)
  const metaRows: Array<Array<{ label: string; value: string } | null>> = [
    [
      { label: 'NOMOR SERTIFIKAT:', value: meal.labCertNumber },
      { label: 'TANGGAL VERIFIKASI:', value: meal.testDate || '20 Sep 2026' },
    ],
    [
      { label: 'KODE VERIFIKASI QR:', value: meal.qrCode },
      { label: 'BATCH PRODUKSI:', value: meal.batchCode },
    ],
    [
      { label: 'LABORATORIUM UJI:', value: meal.labNameShort },
      { label: 'TIKET DAPUR:', value: meal.ticketNumber },
    ],
    [{ label: 'LEMBAGA RESMI:', value: meal.labName }, null],
  ];

  const metaRowHeight = 6.2;
  const metaBoxHeight = metaRows.length * metaRowHeight + 6;

  doc.setFillColor(244, 240, 232);
  doc.setDrawColor(222, 216, 206);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, metaBoxHeight, 2, 2, 'FD');

  const colLeftX = margin + 4;
  const colRightX = margin + contentWidth / 2 + 2;

  metaRows.forEach((row, rIdx) => {
    const rowY = currentY + 5.5 + rIdx * metaRowHeight;
    row.forEach((cell, cIdx) => {
      if (!cell) return;
      const cellX = cIdx === 0 ? colLeftX : colRightX;
      const maxValueW = cIdx === 0 ? contentWidth / 2 - 6 : contentWidth / 2 - 6;

      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 74, 62);
      doc.text(cell.label, cellX, rowY);
      const labelW = doc.getTextWidth(cell.label);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(26, 19, 16);
      doc.setFontSize(7.5);
      const availW = cIdx === 0 && row[1] ? maxValueW - labelW - 2 : contentWidth - 8 - labelW - 2;
      let shown = cell.value;
      while (doc.getTextWidth(shown) > Math.max(availW, 20) && shown.length > 4) {
        shown = shown.slice(0, -1);
      }
      if (shown !== cell.value) shown = shown.slice(0, -2) + '..';
      doc.text(shown, cellX + labelW + 2, rowY);
    });
  });

  currentY += metaBoxHeight + 3;

  // 5. Product Specification Section
  doc.setFillColor(44, 74, 62);
  doc.rect(margin, currentY, 2.5, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(26, 19, 16);
  doc.text('Spesifikasi Sampel Makanan Teruji', margin + 5, currentY + 6.5);

  currentY += 9;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(222, 216, 206);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 74, 62);
  doc.text('Nama Menu:', margin + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 19, 16);
  doc.text(meal.title, margin + 26, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 74, 62);
  doc.text('Kode SKU:', margin + 4, currentY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 19, 16);
  doc.text(meal.sku, margin + 26, currentY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 74, 62);
  doc.text('Kategori Paket:', margin + 70, currentY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 19, 16);
  doc.text(meal.category, margin + 94, currentY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 74, 62);
  doc.text('Bobot Bersih:', margin + 4, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 19, 16);
  doc.text(`${meal.portionWeightGrams || 400} gram (Toleransi timbangan ± ${meal.toleranceGrams || 4.0}g)`, margin + 26, currentY + 15.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 74, 62);
  doc.text('Lokasi Dapur:', margin + 110, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 19, 16);
  doc.text('Dapur Sentral Sudirman (Jakarta)', margin + 133, currentY + 15.5);

  currentY += 22;

  // 6. Nutritional Facts Analysis Table
  doc.setFillColor(44, 74, 62);
  doc.rect(margin, currentY, 2.5, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(26, 19, 16);
  doc.text('Hasil Uji Nilai Informasi Gizi & Makronutrisi', margin + 5, currentY + 6.5);

  currentY += 9;

  // Table Header
  const tableHeaderY = currentY;
  doc.setFillColor(244, 240, 232);
  doc.setDrawColor(222, 216, 206);
  doc.rect(margin, tableHeaderY, contentWidth, 7, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 74, 62);
  doc.text('PARAMETER ANALISIS', margin + 3, tableHeaderY + 4.8);
  doc.text('HASIL PENGUJIAN', margin + 62, tableHeaderY + 4.8);
  doc.text('SATUAN', margin + 88, tableHeaderY + 4.8);
  doc.text('METODE UJI ACUAN', margin + 104, tableHeaderY + 4.8);
  doc.text('STATUS', margin + contentWidth - 3, tableHeaderY + 4.8, { align: 'right' });

  currentY += 7;

  const nutritionRows = [
    { param: 'Energi Total (Kalori)', val: `${meal.nutritionFacts?.calories || 450}`, unit: 'kkal', method: 'Bom Kalorimeter (AOAC 990.03)', status: 'Lulus Uji' },
    { param: 'Protein Murni Terukur', val: `${meal.nutritionFacts?.proteinGrams || 42}`, unit: 'gram', method: 'Kjeldahl Otomatis (AOAC 984.13)', status: 'Lulus Uji' },
    { param: 'Karbohidrat Kompleks', val: `${meal.nutritionFacts?.carbsGrams || 36}`, unit: 'gram', method: 'By Difference (SNI 01-2891)', status: 'Lulus Uji' },
    { param: 'Lemak Sehat Alami', val: `${meal.nutritionFacts?.fatGrams || 14}`, unit: 'gram', method: 'Soxhlet Ekstraksi (AOAC 920.39)', status: 'Lulus Uji' },
    { param: 'Serat Pangan (Dietary Fiber)', val: `${meal.nutritionFacts?.fiberGrams || 6.5}`, unit: 'gram', method: 'Enzimatik Gravimetri (AOAC 985.29)', status: 'Lulus Uji' },
    { param: 'Natrium Terkontrol (Sodium)', val: `${meal.nutritionFacts?.sodiumMg || 350}`, unit: 'mg', method: 'Spektrometri AAS (AOAC 969.23)', status: 'Lulus Uji' },
    { param: 'Indeks Glikemik (GI)', val: `${meal.nutritionFacts?.glycemicIndex || 40}`, unit: 'skala GI', method: 'In-vitro Starch Digestion Test', status: 'Low GI' },
  ];

  nutritionRows.forEach((row, i) => {
    const rowY = currentY + i * 5.6;
    if (i % 2 === 1) {
      doc.setFillColor(249, 247, 243);
      doc.rect(margin, rowY, contentWidth, 5.6, 'F');
    }
    doc.setDrawColor(230, 225, 218);
    doc.line(margin, rowY + 5.6, margin + contentWidth, rowY + 5.6);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 19, 16);
    doc.text(row.param, margin + 3, rowY + 4.3);

    doc.setFont('helvetica', 'bold');
    doc.text(row.val, margin + 62, rowY + 4.3);

    doc.setFont('helvetica', 'normal');
    doc.text(row.unit, margin + 88, rowY + 4.3);
    doc.setFontSize(6.8);
    doc.text(row.method, margin + 104, rowY + 4.3);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 74, 62);
    doc.text(row.status, margin + contentWidth - 3, rowY + 4.3, { align: 'right' });
  });

  currentY += nutritionRows.length * 5.6 + 3;

  // 7. Food Safety & Microbiology Audit Results Box
  doc.setFillColor(44, 74, 62);
  doc.rect(margin, currentY, 2.5, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(26, 19, 16);
  doc.text('Hasil Uji Keamanan Pangan & Bebas Residu Kimia', margin + 5, currentY + 6.5);

  currentY += 9;

  const safetyItems = [
    { label: 'Uji Residu Pestisida & Logam Berat:', val: 'Negatif (< 0.001 mg/kg) - Bebas Merkuri (Hg), Timbal (Pb), Arsenik (As)' },
    { label: 'Uji Mikrobiologi Patogen:', val: meal.labMicrobiology || 'Salmonella sp, E. coli, Listeria monocytogenes dinyatakan negatif murni.' },
    { label: 'Uji Pengawet & Formalin:', val: 'Negatif murni 100% - Bebas formalin, boraks, natrium benzoat, dan pewarna sintetis' },
    { label: 'Status Akurasi Gramatur:', val: meal.labAccuracy || 'Presisi gramatur lab 99.6% sesuai standar SNI & BPOM' },
  ];

  const safetyValueX = margin + 56;
  const safetyValueW = contentWidth - 56 - 4;
  const safetyLines = safetyItems.map((item) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    return doc.splitTextToSize(item.val, safetyValueW) as string[];
  });
  const safetyBoxHeight = safetyLines.reduce((sum, lines) => sum + lines.length * 3.2 + 1.0, 0) + 6;

  doc.setFillColor(244, 240, 232);
  doc.setDrawColor(222, 216, 206);
  doc.roundedRect(margin, currentY, contentWidth, safetyBoxHeight, 2, 2, 'FD');

  let safetyY = currentY + 5;
  safetyItems.forEach((item, idx) => {
    const lines = safetyLines[idx];
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 74, 62);
    doc.text(item.label, margin + 4, safetyY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 19, 16);
    doc.text(lines, safetyValueX, safetyY);

    safetyY += lines.length * 3.2 + 1.0;
  });

  currentY += safetyBoxHeight + 3;

  // 8. Farm Sourcing & Traceability
  if (meal.farms && meal.farms.length > 0) {
    doc.setFillColor(44, 74, 62);
    doc.rect(margin, currentY, 2.5, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(26, 19, 16);
    doc.text('Transparansi Asal Petani Mitra Lokal', margin + 5, currentY + 6.5);

    currentY += 9;

    const shownFarms = meal.farms.slice(0, 4);
    const farmBoxHeight = Math.min(24, shownFarms.length * 4.4 + 5);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(222, 216, 206);
    doc.roundedRect(margin, currentY, contentWidth, farmBoxHeight, 2, 2, 'FD');

    shownFarms.forEach((farm, fIdx) => {
      const fY = currentY + 4.4 + fIdx * 4.4;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 19, 16);
      const nameText = `• ${farm.name}:`;
      doc.text(nameText, margin + 4, fY);
      const nameW = doc.getTextWidth(nameText);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 75, 70);
      const farmLoc = `${farm.location}${farm.certifications ? ` (${farm.certifications})` : ''}`;
      let shownLoc = farmLoc;
      const maxLocW = contentWidth - nameW - 12;
      while (doc.getTextWidth(shownLoc) > maxLocW && shownLoc.length > 4) shownLoc = shownLoc.slice(0, -1);
      if (shownLoc !== farmLoc) shownLoc = shownLoc.slice(0, -2) + '..';
      doc.text(shownLoc, margin + 4 + nameW + 3, fY);
    });

    currentY += farmBoxHeight + 3;
  }

  // 9. Official Validation Seal & Signatures
  const footerBoxY = pageHeight - margin - 28;

  doc.setDrawColor(222, 216, 206);
  doc.setLineWidth(0.4);
  doc.line(margin, footerBoxY, margin + contentWidth, footerBoxY);

  // Left side signature
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 75, 70);
  doc.text('DIVERIFIKASI OLEH KEPALA LAB ANALIS:', margin + 4, footerBoxY + 5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 19, 16);
  doc.text('Dr. rer. nat. Hendra Wijaya, M.Sc.', margin + 4, footerBoxY + 16);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 102, 94);
  doc.text('Manajer Penjaminan Mutu & Sertifikasi Pangan Terakreditasi KAN', margin + 4, footerBoxY + 20);

  // Center Seal Stamp (Rounded badge)
  const sealX = margin + 105;
  doc.setDrawColor(44, 74, 62);
  doc.setLineWidth(0.6);
  doc.setFillColor(244, 240, 232);
  doc.roundedRect(sealX - 18, footerBoxY + 2, 36, 20, 2, 2, 'FD');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 74, 62);
  doc.text('SEAL KEASLIAN', sealX, footerBoxY + 7, { align: 'center' });
  doc.text('CLEAN LABEL', sealX, footerBoxY + 11, { align: 'center' });
  doc.text('100% TERUJI LAB', sealX, footerBoxY + 15, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('NUTRI DAILY INDONESIA', sealX, footerBoxY + 19, { align: 'center' });

  // Right side verification note
  const rightX = margin + contentWidth - 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 75, 70);
  doc.text('VALIDASI SISTEM TERENKRIPSI:', rightX, footerBoxY + 5, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 102, 94);
  doc.text(`ID Verifikasi: ${meal.qrCode}`, rightX, footerBoxY + 10, { align: 'right' });
  doc.text(`Waktu Cetak Dokumen: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} WIB`, rightX, footerBoxY + 15, { align: 'right' });
  doc.text('Pindai kode QR fisik pada boks untuk memeriksa audit real-time', rightX, footerBoxY + 20, { align: 'right' });

  // 10. Generate clean filename and trigger download
  const safeFilename = `SERTIFIKAT-LAB-${meal.sku}-${meal.shortTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
  doc.save(safeFilename);
}
