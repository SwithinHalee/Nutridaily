import { HealthProfileService } from '../modules/health-profile/health-profile.service';

describe('HealthProfileHistory (SCD Tipe 2 - Shadow Table Versioning)', () => {
  let service: HealthProfileService;

  beforeEach(() => {
    // Inisialisasi service tanpa Prisma (menggunakan in-memory fallback)
    service = new HealthProfileService(null);
  });

  it('harus membuat Versi 1 saat profil kesehatan pertama kali disimpan', async () => {
    const userId = 'user-test-001';
    await service.upsertProfile(userId, {
      heightCm: 175,
      weightKg: 85,
      age: 29,
      gender: 'MALE',
      activityLevel: 'SEDENTARY',
      goal: 'WEIGHT_LOSS_LEAN_SCULPT',
      allergies: ['SEAFOOD'],
      medicalConditions: ['HYPERTENSION'],
      confidentialMedicalNotes: 'Catatan awal: pasien tensi 140/90, hindari natrium berlebih.',
    });

    const history = await service.getProfileHistory(userId);
    expect(history.length).toBe(1);

    const v1 = history[0];
    expect(v1.version).toBe(1);
    expect(v1.weightKg).toBe(85);
    expect(v1.changeReason).toBe('INITIAL_REGISTRATION');
    expect(v1.effectiveTo).toBeNull();
    expect(v1.decryptedMedicalNotes).toBe('Catatan awal: pasien tensi 140/90, hindari natrium berlebih.');
    expect(v1.encryptedMedicalNotes).toBeDefined();
    expect(v1.encryptedMedicalNotes).toContain(':'); // Format iv:tag:ciphertext
  });

  it('harus membuat Versi 2 berurutan, menutup Versi 1 (effectiveTo terisi), saat profil diperbarui', async () => {
    const userId = 'user-test-002';

    // 1. Pendaftaran awal (Versi 1)
    await service.upsertProfile(userId, {
      heightCm: 170,
      weightKg: 80,
      age: 30,
      gender: 'FEMALE',
      activityLevel: 'LIGHT',
      goal: 'WEIGHT_LOSS_LEAN_SCULPT',
      confidentialMedicalNotes: 'Catatan konsultasi minggu ke-1.',
    });

    // 2. Pembaruan 1 bulan kemudian (Versi 2): berat turun ke 77 kg
    await service.upsertProfile(userId, {
      heightCm: 170,
      weightKg: 77,
      age: 30,
      gender: 'FEMALE',
      activityLevel: 'LIGHT',
      goal: 'WEIGHT_LOSS_LEAN_SCULPT',
      confidentialMedicalNotes: 'Catatan konsultasi minggu ke-4: berat turun 3 kg, diet berhasil.',
    });

    const history = await service.getProfileHistory(userId);
    expect(history.length).toBe(2);

    const [v1, v2] = history;

    // Verifikasi Versi 1 ditutup
    expect(v1.version).toBe(1);
    expect(v1.weightKg).toBe(80);
    expect(v1.effectiveTo).not.toBeNull();
    expect(v1.decryptedMedicalNotes).toBe('Catatan konsultasi minggu ke-1.');

    // Verifikasi Versi 2 aktif sebagai versi mutakhir
    expect(v2.version).toBe(2);
    expect(v2.weightKg).toBe(77);
    expect(v2.effectiveTo).toBeNull();
    expect(v2.changeReason).toBe('TDEE_RECALCULATION');
    expect(v2.decryptedMedicalNotes).toBe('Catatan konsultasi minggu ke-4: berat turun 3 kg, diet berhasil.');

    // Verifikasi enkripsi independen (IV acak berbeda)
    expect(v1.encryptedMedicalNotes).not.toBe(v2.encryptedMedicalNotes);
  });

  it('harus menjaga data profil utama tetap selaras dengan versi terbaru', async () => {
    const userId = 'user-test-003';

    await service.upsertProfile(userId, {
      heightCm: 180,
      weightKg: 90,
      age: 25,
      gender: 'MALE',
      activityLevel: 'MODERATE',
      goal: 'WEIGHT_LOSS_LEAN_SCULPT',
    });

    await service.upsertProfile(userId, {
      heightCm: 180,
      weightKg: 86,
      age: 25,
      gender: 'MALE',
      activityLevel: 'VERY_ACTIVE',
      goal: 'MUSCLE_GAIN_FIT_BUILD',
    });

    const current = await service.findProfileByUserId(userId);
    expect(current).not.toBeNull();
    expect(current!.weightKg).toBe(86);
    expect(current!.activityLevel).toBe('VERY_ACTIVE');

    const history = await service.getProfileHistory(userId);
    expect(history.length).toBe(2);
    expect(history[1].version).toBe(2);
  });
});
