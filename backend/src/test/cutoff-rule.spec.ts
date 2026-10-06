import { CutoffValidator, CutoffValidationException } from '../modules/subscriptions/cutoff-validator';

// Kalender acuan Oktober 2026: 05 = Senin, 06 = Selasa, 07 = Rabu, 08 = Kamis,
// 09 = Jumat, 10 = Sabtu, 11 = Minggu, 12 = Senin.

describe('CutoffValidator (20:00 WIB Subscription Rule)', () => {
  it('should ALLOW modification for H+1 delivery before 20:00 WIB', () => {
    // Current time: Monday 2026-10-05 at 14:30:00 WIB (which is 07:30 UTC)
    const simulatedNow = new Date(Date.UTC(2026, 9, 5, 7, 30, 0)); // 14:30 WIB
    const targetTomorrow = '2026-10-06';

    const result = CutoffValidator.validateModificationAllowed(targetTomorrow, simulatedNow);
    expect(result.isAllowed).toBe(true);
  });

  it('should REJECT modification for H+1 delivery after 20:00 WIB', () => {
    // Current time: Monday 2026-10-05 at 20:15:00 WIB (which is 13:15 UTC)
    const simulatedNow = new Date(Date.UTC(2026, 9, 5, 13, 15, 0)); // 20:15 WIB
    const targetTomorrow = '2026-10-06';

    const result = CutoffValidator.validateModificationAllowed(targetTomorrow, simulatedNow);
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toContain('Batas waktu modifikasi (Cutoff) pukul 20.00 WIB telah lewat');
  });

  it('should ALWAYS ALLOW modification for H+2 or further regardless of current hour', () => {
    // Current time: Monday 2026-10-05 at 23:45:00 WIB (which is 16:45 UTC)
    const simulatedNow = new Date(Date.UTC(2026, 9, 5, 16, 45, 0));
    const targetHPlus2 = '2026-10-07';

    const result = CutoffValidator.validateModificationAllowed(targetHPlus2, simulatedNow);
    expect(result.isAllowed).toBe(true);
  });

  it('should REJECT modification for same-day delivery (H+0)', () => {
    const simulatedNow = new Date(Date.UTC(2026, 9, 5, 3, 0, 0)); // 10:00 WIB
    const targetToday = '2026-10-05';

    const result = CutoffValidator.validateModificationAllowed(targetToday, simulatedNow);
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toContain('telah masuk proses dapur/pengantaran');
  });

  it('should throw CutoffValidationException when assert fails', () => {
    const simulatedNow = new Date(Date.UTC(2026, 9, 5, 13, 30, 0)); // 20:30 WIB
    const targetTomorrow = '2026-10-06';

    expect(() => {
      CutoffValidator.assertModificationAllowed(targetTomorrow, simulatedNow);
    }).toThrow(CutoffValidationException);
  });
});

describe('CutoffValidator (Weekend Closure Rule)', () => {
  it('should REJECT Saturday delivery target from Friday', () => {
    // Current time: Friday 2026-10-09 at 10:00:00 WIB (which is 03:00 UTC)
    const simulatedNow = new Date(Date.UTC(2026, 9, 9, 3, 0, 0));
    const targetSaturday = '2026-10-10';

    const result = CutoffValidator.validateModificationAllowed(targetSaturday, simulatedNow);
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toContain('Sabtu dan Minggu');
  });

  it('should REJECT Sunday delivery target from Saturday', () => {
    // Current time: Saturday 2026-10-10 at 10:00:00 WIB (which is 03:00 UTC)
    const simulatedNow = new Date(Date.UTC(2026, 9, 10, 3, 0, 0));
    const targetSunday = '2026-10-11';

    const result = CutoffValidator.validateModificationAllowed(targetSunday, simulatedNow);
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toContain('Sabtu dan Minggu');
  });

  it('should ALLOW Monday delivery edit on Friday night past cutoff', () => {
    // Current time: Friday 2026-10-09 at 21:00:00 WIB (which is 14:00 UTC)
    const simulatedNow = new Date(Date.UTC(2026, 9, 9, 14, 0, 0));
    const targetMonday = '2026-10-12';

    const result = CutoffValidator.validateModificationAllowed(targetMonday, simulatedNow);
    expect(result.isAllowed).toBe(true);
  });

  it('should REJECT Monday delivery edit on Sunday night past cutoff', () => {
    // Current time: Sunday 2026-10-11 at 20:30:00 WIB (which is 13:30 UTC)
    const simulatedNow = new Date(Date.UTC(2026, 9, 11, 13, 30, 0));
    const targetMonday = '2026-10-12';

    const result = CutoffValidator.validateModificationAllowed(targetMonday, simulatedNow);
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toContain('Batas waktu modifikasi (Cutoff) pukul 20.00 WIB telah lewat');
  });

  it('should resolve next delivery date skipping the weekend', () => {
    // Friday 2026-10-09 10:00 WIB -> Monday 2026-10-12
    expect(CutoffValidator.getNextDeliveryDateStr(new Date(Date.UTC(2026, 9, 9, 3, 0, 0)))).toBe('2026-10-12');
    // Saturday 2026-10-10 10:00 WIB -> Monday 2026-10-12
    expect(CutoffValidator.getNextDeliveryDateStr(new Date(Date.UTC(2026, 9, 10, 3, 0, 0)))).toBe('2026-10-12');
    // Monday 2026-10-05 10:00 WIB -> Tuesday 2026-10-06
    expect(CutoffValidator.getNextDeliveryDateStr(new Date(Date.UTC(2026, 9, 5, 3, 0, 0)))).toBe('2026-10-06');
  });

  it('should detect weekend dates correctly', () => {
    expect(CutoffValidator.isWeekendDate('2026-10-10')).toBe(true);
    expect(CutoffValidator.isWeekendDate('2026-10-11')).toBe(true);
    expect(CutoffValidator.isWeekendDate('2026-10-09')).toBe(false);
    expect(CutoffValidator.isWeekendDate('2026-10-12')).toBe(false);
  });
});
