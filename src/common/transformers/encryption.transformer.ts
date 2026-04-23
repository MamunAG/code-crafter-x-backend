import { ValueTransformer } from 'typeorm';

import { EncryptionService } from '../services/encryption.service';

export class EncryptionTransformer implements ValueTransformer {
  private encryptionService: EncryptionService;

  constructor() {
    // We'll initialize this lazily when needed
  }

  private getEncryptionService(): EncryptionService {
    if (!this.encryptionService) {
      // This is a simplified approach - in practice, you'd want to inject this properly
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ConfigService } = require('@nestjs/config');
      const configService = new ConfigService();
      this.encryptionService = new EncryptionService(configService);
    }
    return this.encryptionService;
  }

  /**
   * Transforms the value before saving to database (encrypts)
   */
  to(value: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return this.getEncryptionService().encryptForStorage(value);
  }

  /**
   * Transforms the value after loading from database (decrypts)
   */
  from(value: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return this.getEncryptionService().decryptFromStorage(value);
  }
}
