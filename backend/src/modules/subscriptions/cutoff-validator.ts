export class CutoffValidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CutoffValidationException';
  }
}

export class CutoffValidator {
  private static readonly CUTOFF_HOUR_WIB = 20; // 20:00 WIB
  private static readonly CUTOFF_MINUTE_WIB = 0;
  private static readonly TIMEZONE_OFFSET_HOURS = 7; // WIB is UTC+7

  /**
   * Converts a given Date object to WIB (UTC+7) components.
   * dayOfWeek mengikuti konvensi Date: 0 untuk Minggu sampai 6 untuk Sabtu.
   */
  public static getWibTime(date: Date = new Date()): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    dayOfWeek: number;
    dateString: string;
  } {
    const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
    const wibTime = new Date(utcTime + 3600000 * this.TIMEZONE_OFFSET_HOURS);

    const year = wibTime.getFullYear();
    const month = wibTime.getMonth() + 1;
    const day = wibTime.getDate();
    const hour = wibTime.getHours();
    const minute = wibTime.getMinutes();
    const second = wibTime.getSeconds();
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, hour, minute, second, dayOfWeek, dateString };
  }

  /**
   * Dapur sentral tutup pada Sabtu dan Minggu. Pengiriman hanya Senin sampai Jumat.
   */
  public static isWeekendDayOfWeek(dayOfWeek: number): boolean {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  public static getDayOfWeekFromDateString(dateStr: string): number {
    const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  public static isWeekendDate(targetDeliveryDate: string | Date): boolean {
    if (typeof targetDeliveryDate === 'string') {
      return this.isWeekendDayOfWeek(this.getDayOfWeekFromDateString(targetDeliveryDate));
    }
    return this.isWeekendDayOfWeek(this.getWibTime(targetDeliveryDate).dayOfWeek);
  }

  /**
   * Menghitung tanggal pengiriman berikutnya (YYYY-MM-DD) dengan melewati Sabtu dan Minggu.
   */
  public static getNextDeliveryDateStr(fromDate: Date = new Date()): string {
    const fromWib = this.getWibTime(fromDate);
    let cursor = new Date(Date.UTC(fromWib.year, fromWib.month - 1, fromWib.day));
    do {
      cursor = new Date(cursor.getTime() + 86400000);
    } while (this.isWeekendDayOfWeek(cursor.getUTCDay()));
    const year = cursor.getUTCFullYear();
    const month = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    const day = String(cursor.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Validates if a modification requested for targetDeliveryDate (YYYY-MM-DD or Date)
   * respects the 20:00 WIB cutoff time.
   */
  public static validateModificationAllowed(
    targetDeliveryDate: string | Date,
    currentTime: Date = new Date()
  ): { isAllowed: boolean; reason?: string } {
    const currentWib = this.getWibTime(currentTime);

    let targetDateStr: string;
    if (typeof targetDeliveryDate === 'string') {
      targetDateStr = targetDeliveryDate.substring(0, 10);
    } else {
      const targetWib = this.getWibTime(targetDeliveryDate);
      targetDateStr = targetWib.dateString;
    }

    const todayDateStr = currentWib.dateString;

    // Rule 0: Dapur libur Sabtu dan Minggu sehingga tidak ada target pengiriman akhir pekan
    if (this.isWeekendDate(targetDateStr)) {
      return {
        isAllowed: false,
        reason: 'Dapur sentral libur pada Sabtu dan Minggu. Tidak ada pengiriman pada tanggal tersebut. Pilih hari Senin sampai Jumat.',
      };
    }

    const todayWibObj = new Date(currentWib.year, currentWib.month - 1, currentWib.day);
    const tomorrowWibObj = new Date(todayWibObj);
    tomorrowWibObj.setDate(tomorrowWibObj.getDate() + 1);
    const tomorrowWib = this.getWibTime(tomorrowWibObj);
    const tomorrowDateStr = tomorrowWib.dateString;

    // Rule 1: Cannot modify past dates or today's delivery
    if (targetDateStr <= todayDateStr) {
      return {
        isAllowed: false,
        reason: 'Pesanan untuk hari ini atau tanggal lampau telah masuk proses dapur/pengantaran dan tidak dapat diubah.',
      };
    }

    // Rule 2: If target is tomorrow (H+1), verify WIB time against 20:00:00 cutoff
    if (targetDateStr === tomorrowDateStr) {
      const isPastCutoff =
        currentWib.hour > this.CUTOFF_HOUR_WIB ||
        (currentWib.hour === this.CUTOFF_HOUR_WIB && currentWib.minute >= this.CUTOFF_MINUTE_WIB);

      if (isPastCutoff) {
        return {
          isAllowed: false,
          reason: `Batas waktu modifikasi (Cutoff) pukul 20.00 WIB telah lewat (${String(currentWib.hour).padStart(2, '0')}:${String(currentWib.minute).padStart(2, '0')} WIB). Dapur sedang mempersiapkan bahan baku untuk besok.`,
        };
      }
    }

    return { isAllowed: true };
  }

  /**
   * Asserts modification is allowed, throwing an exception if cutoff has passed.
   */
  public static assertModificationAllowed(targetDeliveryDate: string | Date, currentTime: Date = new Date()): void {
    const result = this.validateModificationAllowed(targetDeliveryDate, currentTime);
    if (!result.isAllowed) {
      throw new CutoffValidationException(result.reason || 'Batas waktu modifikasi pesanan telah berakhir.');
    }
  }
}
