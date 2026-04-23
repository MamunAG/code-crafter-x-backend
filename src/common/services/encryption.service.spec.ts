import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ENCRYPTION_KEY') {
                return 'test-encryption-key-32-bytes-long';
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const original = 'sensitive data';
      const encrypted = service.encrypt(original);

      expect(encrypted).toBeDefined();
      expect(encrypted?.encrypted).toBeDefined();
      expect(encrypted?.iv).toBeDefined();
      expect(encrypted?.authTag).toBeDefined();
      expect(encrypted?.encrypted).not.toBe(original);
    });

    it('should return null for empty input', () => {
      expect(service.encrypt('')).toBeNull();
      expect(service.encrypt(null as any)).toBeNull();
      expect(service.encrypt(undefined as any)).toBeNull();
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const original = 'sensitive data';
      const encrypted = service.encrypt(original);
      expect(encrypted).not.toBeNull();
      const decrypted = service.decrypt(encrypted!);

      expect(decrypted).toBe(original);
    });

    it('should return null for empty input', () => {
      expect(service.decrypt(null as any)).toBeNull();
      expect(service.decrypt(undefined as any)).toBeNull();
    });

    it('should throw error for invalid encrypted data', () => {
      const invalidData = {
        encrypted: 'invalid',
        iv: 'invalid',
        authTag: 'invalid',
      };

      expect(() => service.decrypt(invalidData)).toThrow('Decryption failed');
    });
  });

  describe('encryptForStorage', () => {
    it('should encrypt and return JSON string', () => {
      const original = 'sensitive data';
      const encrypted = service.encryptForStorage(original);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      // Should be valid JSON
      const parsed = JSON.parse(encrypted!);
      expect(parsed.encrypted).toBeDefined();
      expect(parsed.iv).toBeDefined();
      expect(parsed.authTag).toBeDefined();
    });

    it('should return null for empty input', () => {
      expect(service.encryptForStorage('')).toBeNull();
      expect(service.encryptForStorage(null as any)).toBeNull();
      expect(service.encryptForStorage(undefined as any)).toBeNull();
    });
  });

  describe('decryptFromStorage', () => {
    it('should decrypt from storage format', () => {
      const original = 'sensitive data';
      const encrypted = service.encryptForStorage(original);
      expect(encrypted).not.toBeNull();
      const decrypted = service.decryptFromStorage(encrypted!);

      expect(decrypted).toBe(original);
    });

    it('should return null for empty input', () => {
      expect(service.decryptFromStorage('')).toBeNull();
      expect(service.decryptFromStorage(null as any)).toBeNull();
      expect(service.decryptFromStorage(undefined as any)).toBeNull();
    });

    it('should throw error for invalid JSON', () => {
      expect(() => service.decryptFromStorage('invalid json')).toThrow(
        'Failed to parse encrypted data',
      );
    });
  });

  describe('generateKey', () => {
    it('should generate a base64 encoded key', () => {
      const key = EncryptionService.generateKey();

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');

      // Should be valid base64
      const buffer = Buffer.from(key, 'base64');
      expect(buffer.length).toBe(32); // 256 bits
    });
  });

  describe('integration', () => {
    it('should handle complex data', () => {
      const complexData =
        '{"user": "john", "ssn": "123-45-6789", "creditCard": "4111-1111-1111-1111"}';

      const encrypted = service.encryptForStorage(complexData);
      expect(encrypted).not.toBeNull();
      const decrypted = service.decryptFromStorage(encrypted!);

      expect(decrypted).toBe(complexData);
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';

      const encrypted = service.encryptForStorage(specialChars);
      expect(encrypted).not.toBeNull();
      const decrypted = service.decryptFromStorage(encrypted!);

      expect(decrypted).toBe(specialChars);
    });

    it('should handle unicode characters', () => {
      const unicodeData = 'Hello 世界 🌍 emoji 🚀';

      const encrypted = service.encryptForStorage(unicodeData);
      expect(encrypted).not.toBeNull();
      const decrypted = service.decryptFromStorage(encrypted!);

      expect(decrypted).toBe(unicodeData);
    });
  });
});
