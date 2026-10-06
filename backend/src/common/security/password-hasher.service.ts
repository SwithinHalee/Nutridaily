import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import { authConfig } from '../../config/auth.config';
import { generateOpaqueToken } from './token.util';

/**
 * Argon2id password hashing (OWASP recommended). Legacy bcrypt hashes are still verifiable so
 * existing accounts keep working; they are transparently upgraded to Argon2id on next login.
 */
@Injectable()
export class PasswordHasherService {
  private readonly options = {
    type: argon2.argon2id,
    memoryCost: authConfig.argon2.memoryCost,
    timeCost: authConfig.argon2.timeCost,
    parallelism: authConfig.argon2.parallelism,
  };

  /** Pre-computed hash used to equalise timing when the account does not exist. */
  private dummyHashPromise: Promise<string> | null = null;

  async hash(password: string): Promise<string> {
    return argon2.hash(password, this.options);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      if (hash.startsWith('$argon2')) {
        return await argon2.verify(hash, password);
      }
      if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
        return await bcrypt.compare(password, hash);
      }
      return false;
    } catch {
      return false;
    }
  }

  needsRehash(hash: string): boolean {
    if (!hash.startsWith('$argon2id$')) return true;
    try {
      return argon2.needsRehash(hash, this.options);
    } catch {
      return true;
    }
  }

  /** Runs a full Argon2 verification against a throwaway hash to mask user-not-found timing. */
  async verifyDummy(password: string): Promise<void> {
    if (!this.dummyHashPromise) {
      this.dummyHashPromise = this.hash(generateOpaqueToken());
    }
    await this.verify(await this.dummyHashPromise, password);
  }

  /** A hash no password can ever match. Used when anonymising deleted accounts. */
  async unusableHash(): Promise<string> {
    return this.hash(generateOpaqueToken(48));
  }
}
