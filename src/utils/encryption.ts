import crypto from "crypto";

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
