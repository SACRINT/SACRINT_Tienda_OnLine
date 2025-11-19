// Data Encryption
// Encrypt sensitive data at rest

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY not set");
  }

  // Derive key using scrypt
  const salt = process.env.ENCRYPTION_SALT || "default-salt";
  return scryptSync(secret, salt, KEY_LENGTH);
}

// Encrypt data
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  // Combine iv + tag + encrypted data
  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
}

// Decrypt data
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }

  const [ivHex, tagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const key = getEncryptionKey();

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: 16,
  });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Encrypt object
export function encryptObject(obj: object): string {
  return encrypt(JSON.stringify(obj));
}

// Decrypt object
export function decryptObject<T>(ciphertext: string): T {
  return JSON.parse(decrypt(ciphertext)) as T;
}

// Hash for comparison (one-way)
export function hashForComparison(value: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(value, salt, KEY_LENGTH);
  return salt.toString("hex") + ":" + key.toString("hex");
}

// Verify hash
export function verifyHash(value: string, hash: string): boolean {
  const [saltHex, keyHex] = hash.split(":");
  const salt = Buffer.from(saltHex, "hex");
  const expectedKey = Buffer.from(keyHex, "hex");
  const actualKey = scryptSync(value, salt, KEY_LENGTH);

  // Constant-time comparison
  if (actualKey.length !== expectedKey.length) return false;

  let result = 0;
  for (let i = 0; i < actualKey.length; i++) {
    result |= actualKey[i] ^ expectedKey[i];
  }

  return result === 0;
}

// Mask sensitive data for logging
export function maskSensitiveData(
  data: string,
  visibleChars: number = 4,
): string {
  if (data.length <= visibleChars * 2) {
    return "*".repeat(data.length);
  }

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = "*".repeat(data.length - visibleChars * 2);

  return start + masked + end;
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}
