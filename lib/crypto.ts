import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;

function decodeEncryptionKey(raw: string): Buffer {
  const trimmed = raw.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  const base64 = Buffer.from(trimmed, "base64");
  if (base64.length === KEY_BYTES) {
    return base64;
  }

  throw new Error(
    "APP_ENCRYPTION_KEY must be 32 bytes (256 bits), encoded as 64-character hex or base64",
  );
}

function getEncryptionKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;

  if (!raw?.trim()) {
    throw new Error("APP_ENCRYPTION_KEY is not set");
  }

  const key = decodeEncryptionKey(raw);

  if (key.length !== KEY_BYTES) {
    throw new Error(
      "APP_ENCRYPTION_KEY must be 32 bytes (256 bits), encoded as 64-character hex or base64",
    );
  }

  return key;
}

export function encryptData(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptData(encryptedText: string): string {
  const parts = encryptedText.split(":");

  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new Error("Invalid encrypted payload");
  }

  const [ivPart, tagPart, dataPart] = parts;
  const iv = Buffer.from(ivPart, "base64");
  const tag = Buffer.from(tagPart, "base64");
  const ciphertext = Buffer.from(dataPart, "base64");

  if (iv.length !== IV_BYTES || tag.length !== AUTH_TAG_BYTES) {
    throw new Error("Invalid encrypted payload");
  }

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function hashForLookup(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function phoneSecretFields(phone: string | null) {
  if (!phone) {
    return { encryptedPhone: null, phoneHash: null };
  }

  return {
    encryptedPhone: encryptData(phone),
    phoneHash: hashForLookup(phone),
  };
}

export function nationalIdSecretFields(nationalId: string | null) {
  if (!nationalId) {
    return { encryptedNationalId: null, nationalIdHash: null };
  }

  return {
    encryptedNationalId: encryptData(nationalId),
    nationalIdHash: hashForLookup(nationalId),
  };
}

function decryptField(encrypted: string | null | undefined) {
  if (!encrypted) {
    return null;
  }

  try {
    return decryptData(encrypted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`Servant field decryption failed: ${message}`);
    return null;
  }
}

export function readServantContact(servant: {
  encryptedPhone?: string | null;
  encryptedNationalId?: string | null;
}) {
  return {
    phone: decryptField(servant.encryptedPhone),
    nationalId: decryptField(servant.encryptedNationalId),
  };
}
