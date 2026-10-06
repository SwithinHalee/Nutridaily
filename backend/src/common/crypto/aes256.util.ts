import * as crypto from 'crypto';

/**
 * AES-256-GCM Encryption / Decryption Helper
 * Compliant with UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
 * Sensitive medical/health notes are encrypted at rest with authenticated encryption (GCM).
 */
export class Aes256GcmUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96-bit recommended for GCM
  private static readonly AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

  private static getKey(): Buffer {
    const rawKey = process.env.DATA_ENCRYPTION_KEY || 'nutridaily-super-secret-key-32b-pdp!!';
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts plaintext into format: `ivHex:authTagHex:encryptedHex`
   */
  public static encrypt(plainText: string): string {
    if (!plainText) return '';
    const key = this.getKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts string from format: `ivHex:authTagHex:encryptedHex`
   */
  public static decrypt(cipherPayload: string): string {
    if (!cipherPayload) return '';
    const parts = cipherPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format for AES-256-GCM.');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = this.getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
