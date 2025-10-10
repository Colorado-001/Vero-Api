import crypto from "crypto";
import bcrypt from "bcryptjs";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export function encryptValue(key: string, value: string): string {
  const encryptionKey = Buffer.from(key, "hex");

  if (encryptionKey.length !== 32)
    throw new Error("Encryption key must be 32 bytes");

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

  let encrypted = cipher.update(value, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + ciphertext
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

export function decryptValue(key: string, encrypted: string): string {
  const encryptionKey = Buffer.from(key, "hex");

  if (encryptionKey.length !== 32)
    throw new Error("Encryption key must be 32 bytes");

  const [ivB64, authTagB64, encryptedB64] = encrypted.split(":");
  if (!ivB64 || !authTagB64 || !encryptedB64)
    throw new Error("Invalid encrypted data");

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedB64, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hashes a plain-text password.
 * @param password - The plain password to hash.
 * @returns The hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10); // 10 rounds is a good default
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain-text password with a hashed password.
 * @param password - The plain password to verify.
 * @param hashedPassword - The stored hashed password.
 * @returns True if they match, false otherwise.
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
