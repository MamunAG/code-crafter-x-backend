import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits

  constructor(private configService: ConfigService) {}

  /**
   * Encrypts a string value
   * @param text - The text to encrypt
   * @returns EncryptedData object containing encrypted text, IV, and auth tag
   */
  encrypt(text: string): EncryptedData | null {
    if (!text) {
      return null;
    }

    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    cipher.setAAD(Buffer.from('blue-atlantic-app', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypts an EncryptedData object back to string
   * @param encryptedData - The encrypted data object
   * @returns The decrypted string
   */
  decrypt(encryptedData: EncryptedData): string | null {
    if (!encryptedData || !encryptedData.encrypted) {
      return null;
    }

    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAAD(Buffer.from('blue-atlantic-app', 'utf8'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypts a value and returns it as a JSON string for database storage
   * @param value - The value to encrypt
   * @returns JSON string containing encrypted data
   */
  encryptForStorage(value: string): string | null {
    if (!value) {
      return null;
    }

    const encryptedData = this.encrypt(value);
    return encryptedData ? JSON.stringify(encryptedData) : null;
  }

  /**
   * Decrypts a value from database storage
   * @param encryptedJson - JSON string containing encrypted data
   * @returns The decrypted string
   */
  decryptFromStorage(encryptedJson: string): string | null {
    if (!encryptedJson) {
      return null;
    }

    try {
      const encryptedData: EncryptedData = JSON.parse(encryptedJson);
      return this.decrypt(encryptedData);
    } catch (error) {
      throw new Error(`Failed to parse encrypted data: ${error.message}`);
    }
  }

  /**
   * Gets the encryption key from environment variables
   * @returns Buffer containing the encryption key
   */
  private getEncryptionKey(): Buffer {
    const key = this.configService.get<string>('ENCRYPTION_KEY');

    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Ensure the key is exactly 32 bytes (256 bits)
    const keyBuffer = Buffer.from(key, 'utf8');

    if (keyBuffer.length !== this.keyLength) {
      // If key is not exactly 32 bytes, hash it to get 32 bytes
      return crypto.createHash('sha256').update(keyBuffer).digest();
    }

    return keyBuffer;
  }

  /**
   * Generates a secure encryption key
   * @returns A base64 encoded encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }
}
