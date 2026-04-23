import { randomBytes } from 'crypto';

const toUrlSafeBase64 = (value: Buffer): string =>
  value
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

export const generateRandomHashedPassword = async (
  length = 16,
): Promise<string> => {
  const bytesNeeded = Math.ceil((length * 3) / 4);
  const password = toUrlSafeBase64(randomBytes(bytesNeeded)).slice(0, length);
  return password;
};

export const generateRandomPassword = generateRandomHashedPassword;
