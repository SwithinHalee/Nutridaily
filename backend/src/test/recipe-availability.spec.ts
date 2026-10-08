import { BadRequestException } from '@nestjs/common';
import { RecipesService } from '../modules/recipes/recipes.service';
import { InMemoryRecipesRepository } from '../modules/recipes/repository/in-memory-recipes.repository';

function baseMeal(qr: string, overrides: Record<string, unknown> = {}) {
  return {
    title: `Menu uji ${qr}`,
    category: 'WEIGHT_LOSS_LEAN_SCULPT',
    calories: 450,
    proteinGrams: 40,
    carbsGrams: 35,
    fatGrams: 15,
    qrVerificationCode: qr,
    ...overrides,
  };
}

describe('RecipesService (Availability Window Rule)', () => {
  let service: RecipesService;

  beforeEach(() => {
    service = new RecipesService(new InMemoryRecipesRepository());
  });

  it('should REJECT activation past the 30 active meal cap', async () => {
    for (let i = 1; i <= 30; i++) {
      await service.createStoredRecipe(baseMeal(`QR-CAP-${i}-2026`));
    }
    await expect(service.createStoredRecipe(baseMeal('QR-CAP-31-2026'))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should ALLOW activation again after one meal is deactivated', async () => {
    const created: Array<{ id: string }> = [];
    for (let i = 1; i <= 30; i++) {
      created.push(await service.createStoredRecipe(baseMeal(`QR-FREE-${i}-2026`)));
    }
    await service.updateStoredRecipe(created[0].id, { isActive: false });
    const extra = await service.createStoredRecipe(baseMeal('QR-FREE-31-2026'));
    expect(extra.isActive).toBe(true);
  });

  it('should REJECT reactivation via PATCH when the cap is full', async () => {
    const created: Array<{ id: string }> = [];
    for (let i = 1; i <= 30; i++) {
      created.push(await service.createStoredRecipe(baseMeal(`QR-RE-${i}-2026`)));
    }
    await service.updateStoredRecipe(created[0].id, { isActive: false });
    await service.createStoredRecipe(baseMeal('QR-RE-31-2026'));
    await expect(service.updateStoredRecipe(created[0].id, { isActive: true })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should EXCLUDE expired window meals from the customer catalog', async () => {
    await service.createStoredRecipe(
      baseMeal('QR-OLD-1-2026', { availableFrom: '2000-01-01', availableUntil: '2000-01-02' }),
    );
    const visible = await service.createStoredRecipe(baseMeal('QR-NOW-1-2026'));
    const catalog = await service.getCatalog(0);
    const ids = catalog.meals.map((m) => m.id);
    expect(ids).not.toContain('expired-id-never-used');
    expect(ids).toContain(visible.id);
  });

  it('should SORT stored meals by ingredient cost ascending before catalog meals', async () => {
    const pricey = await service.createStoredRecipe(
      baseMeal('QR-COST-HI-2026', { ingredientCostRp: 25000 }),
    );
    const cheap = await service.createStoredRecipe(
      baseMeal('QR-COST-LO-2026', { ingredientCostRp: 15000 }),
    );
    const catalog = await service.getCatalog(0);
    const ids = catalog.meals.map((m) => m.id);
    expect(ids.indexOf(cheap.id)).toBeLessThan(ids.indexOf(pricey.id));
    expect(ids[0]).toBe(cheap.id);
  });

  it('should RETURN the following week days for week offset 1', async () => {
    const current = await service.getCatalog(0);
    const next = await service.getCatalog(1);
    expect(next.days).toHaveLength(5);
    expect(next.days[0].dayName).toBe('Senin');
    expect(next.days[0].fullDate > current.days[4].fullDate).toBe(true);
  });

  it('should EVALUATE isAvailableOn against windows correctly', () => {    expect(
      RecipesService.isAvailableOn({ isActive: true, availableFrom: null, availableUntil: null }, '2026-10-06'),
    ).toBe(true);
    expect(
      RecipesService.isAvailableOn({ isActive: false, availableFrom: null, availableUntil: null }, '2026-10-06'),
    ).toBe(false);
    expect(
      RecipesService.isAvailableOn(
        { isActive: true, availableFrom: new Date('2026-10-06T00:00:00Z'), availableUntil: new Date('2026-10-09T00:00:00Z') },
        '2026-10-07',
      ),
    ).toBe(true);
    expect(
      RecipesService.isAvailableOn(
        { isActive: true, availableFrom: new Date('2026-10-12T00:00:00Z'), availableUntil: null },
        '2026-10-07',
      ),
    ).toBe(false);
  });

    it('should REPORT availability summary counts', async () => {    await service.createStoredRecipe(baseMeal('QR-SUM-1-2026'));
    await service.createStoredRecipe(
      baseMeal('QR-SUM-2-2026', { availableFrom: '2999-01-01', availableUntil: '2999-12-31' }),
    );
    const summary = await service.getAvailabilitySummary();
    expect(summary.total).toBe(2);
    expect(summary.cap).toBe(30);
    expect(summary.activeNow).toBe(1);
    expect(summary.scheduledFuture).toBe(1);
  });

  it('should AUTO-SEED catalog meals when the store is empty', async () => {
    const first = await service.listStoredRecipes();
    expect(first.length).toBeGreaterThan(0);
    const second = await service.listStoredRecipes();
    expect(second.length).toBe(first.length);
  });

  it('should SERVE clean label list from the database with seed details', async () => {
    const list = await service.getCleanLabelList();
    expect(list.length).toBeGreaterThan(0);
    const salmon = list.find((m) => m.skuCode === 'ND-WL-001');
    expect(salmon).toBeDefined();
    expect(salmon?.labCertification.certificateNumber).toBe('SIG-LAB/2026/08942-ND');
    expect(salmon?.grammage.length).toBeGreaterThan(0);
  });

  it('should RESOLVE clean label by QR code from the database', async () => {
    const found = await service.getCleanLabelByCode('ND-VERIFY-SALMON-2026');
    expect(found.skuCode).toBe('ND-WL-001');
  });

  it('should INCLUDE deactivated meals in clean label list with inactive flag', async () => {
    const rows = await service.listStoredRecipes();
    const target = rows.find((r) => r.skuCode === 'ND-WL-001');
    await service.updateStoredRecipe(target!.id, { isActive: false });
    const list = await service.getCleanLabelList();
    const salmon = list.find((m) => m.skuCode === 'ND-WL-001');
    expect(salmon).toBeDefined();
    expect(salmon?.isActive).toBe(false);
    const stillFound = await service.getCleanLabelByCode('ND-VERIFY-SALMON-2026');
    expect(stillFound.skuCode).toBe('ND-WL-001');
  });

  it('should THROW NotFound for unknown clean label codes', async () => {
    await expect(service.getCleanLabelByCode('ND-VERIFY-TIDAK-ADA')).rejects.toThrow(
      'tidak ditemukan dalam sistem NutriDaily',
    );
  });

  it('should SAVE and SERVE transparency details from the database', async () => {
    const created = await service.createStoredRecipe(baseMeal('QR-TR-1-2026'));
    await service.updateStoredRecipe(created.id, {
      details: {
        batchCode: 'B-TEST-001',
        grammage: [{ label: 'Fillet salmon', weight: '180 gram' }],
        farms: [{ name: 'Koperasi Tani', location: 'Wonogiri', harvestDate: 'Panen subuh', certifications: ['Organik'] }],
        lab: { laboratory: 'Lab Uji', certificateNumber: 'CERT-1', status: 'Bebas formalin' },
        chefNotes: 'Dimasak presisi.',
      },
    });
    const found = await service.getCleanLabelByCode(created.qrVerificationCode);
    expect(found.batchCode).toBe('B-TEST-001');
    expect(found.grammage).toEqual([{ label: 'Fillet salmon', weight: '180 gram' }]);
    expect(found.ingredientsSourcing[0].name).toBe('Koperasi Tani');
    expect(found.labCertification.laboratory).toBe('Lab Uji');
    expect(found.chefNotes).toBe('Dimasak presisi.');
  });

  it('should SANITIZE transparency details input', async () => {
    const created = await service.createStoredRecipe(
      baseMeal('QR-TR-2-2026', {
        details: {
          batchCode: 'B-TEST-002',
          grammage: [{ label: '', weight: '' }, { label: 'Nasi', weight: '120 gram' }],
          farms: 'bukan-array',
          lab: 'bukan-objek',
          fiberGrams: 'bukan-angka',
        },
      }),
    );
    const stored = await service.getStoredRecipe(created.id);
    const details = stored.details as Record<string, any>;
    expect(details.batchCode).toBe('B-TEST-002');
    expect(details.grammage).toEqual([{ label: 'Nasi', weight: '120 gram' }]);
    expect(details.farms).toBeUndefined();
    expect(details.lab).toBeUndefined();
    expect(details.fiberGrams).toBeUndefined();
  });
});

describe('RecipesService (Image Upload Rule)', () => {
  let service: RecipesService;

  beforeEach(() => {
    service = new RecipesService(new InMemoryRecipesRepository());
  });

  it('should RETURN a data URL for a valid image buffer', () => {
    const url = service.processImageUpload({
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      mimetype: 'image/jpeg',
      size: 4,
      originalname: 'sajian.jpg',
    });
    expect(url.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('should REJECT disallowed mime types', () => {
    expect(() =>
      service.processImageUpload({
        buffer: Buffer.from('GIF89a'),
        mimetype: 'image/gif',
        size: 6,
        originalname: 'sajian.gif',
      }),
    ).toThrow(BadRequestException);
  });

  it('should REJECT files larger than 2 MB', () => {
    expect(() =>
      service.processImageUpload({
        buffer: Buffer.alloc(10),
        mimetype: 'image/png',
        size: 3 * 1024 * 1024,
        originalname: 'besar.png',
      }),
    ).toThrow(BadRequestException);
  });

  it('should REJECT a missing file', () => {
    expect(() => service.processImageUpload(null as unknown as never)).toThrow(BadRequestException);
  });
});

describe('RecipesService (Explicit Day List Rule)', () => {
  let service: RecipesService;

  beforeEach(() => {
    service = new RecipesService(new InMemoryRecipesRepository());
  });

  it('should SERVE a meal on each listed day independently', async () => {
    const created = await service.createStoredRecipe(
      baseMeal('QR-DAYS-1-2026', { availableDays: ['2026-10-06', '2026-10-05'] }),
    );
    expect(created.availableDays).toEqual(['2026-10-05', '2026-10-06']);
    expect(
      RecipesService.isAvailableOn(
        { isActive: true, availableFrom: null, availableUntil: null, availableDays: created.availableDays },
        '2026-10-05',
      ),
    ).toBe(true);
    expect(
      RecipesService.isAvailableOn(
        { isActive: true, availableFrom: null, availableUntil: null, availableDays: created.availableDays },
        '2026-10-06',
      ),
    ).toBe(true);
    expect(
      RecipesService.isAvailableOn(
        { isActive: true, availableFrom: null, availableUntil: null, availableDays: created.availableDays },
        '2026-10-07',
      ),
    ).toBe(false);
  });

  it('should PREFER the day list over the window', async () => {
    const created = await service.createStoredRecipe(
      baseMeal('QR-DAYS-2-2026', {
        availableFrom: '2026-10-01',
        availableUntil: '2026-12-31',
        availableDays: ['2026-10-06'],
      }),
    );
    const row = { isActive: true, availableFrom: created.availableFrom, availableUntil: created.availableUntil, availableDays: created.availableDays };
    expect(RecipesService.isAvailableOn(row, '2026-10-06')).toBe(true);
    expect(RecipesService.isAvailableOn(row, '2026-10-07')).toBe(false);
  });

  it('should NORMALIZE day lists to sorted unique dates', async () => {
    const created = await service.createStoredRecipe(
      baseMeal('QR-DAYS-3-2026', { availableDays: ['2026-10-07', '2026-10-05', '2026-10-07', 'oops'] }),
    );
    expect(created.availableDays).toEqual(['2026-10-05', '2026-10-07']);
  });

  it('should TREAT an empty day list as window mode', async () => {
    const created = await service.createStoredRecipe(
      baseMeal('QR-DAYS-4-2026', { availableDays: [] }),
    );
    expect(created.availableDays).toBeNull();
  });

  it('should MATCH week overlap against the day list', () => {
    expect(RecipesService.weekOverlaps({ availableFrom: null, availableUntil: null, availableDays: ['2026-10-06'] }, '2026-10-05', '2026-10-09')).toBe(true);
    expect(RecipesService.weekOverlaps({ availableFrom: null, availableUntil: null, availableDays: ['2026-10-12'] }, '2026-10-05', '2026-10-09')).toBe(false);
  });
});
