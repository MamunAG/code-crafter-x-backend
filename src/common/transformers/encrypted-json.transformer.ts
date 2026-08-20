import type { ValueTransformer } from 'typeorm';

import { EncryptionTransformer } from './encryption.transformer';

export class EncryptedJsonTransformer<T extends object> implements ValueTransformer {
  private readonly encryption = new EncryptionTransformer();

  to(value: T | null | undefined): string | null {
    if (value == null) return null;
    return this.encryption.to(JSON.stringify(value));
  }

  from(value: string | null | undefined): T | null {
    if (value == null) return null;
    const decrypted = this.encryption.from(value);
    if (!decrypted) return null;
    return JSON.parse(decrypted) as T;
  }
}
