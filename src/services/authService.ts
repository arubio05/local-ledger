const AUTH_STORAGE_KEY = "projectFMJ.localAuth.v1";

const PBKDF2_ITERATIONS = 310_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

type StoredAuthRecord = {
  version: 1;
  salt: string;
  passwordHash: string;
  iterations: number;
  createdAt: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getStoredAuthRecord(): StoredAuthRecord | null {
  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value) as Partial<StoredAuthRecord>;

    if (
      parsed.version !== 1 ||
      typeof parsed.salt !== "string" ||
      typeof parsed.passwordHash !== "string" ||
      typeof parsed.iterations !== "number" ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }

    return parsed as StoredAuthRecord;
  } catch (error) {
    console.error("Unable to read local authentication data:", error);
    return null;
  }
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  if (!window.crypto?.subtle) {
    throw new Error("Secure password hashing is not available on this device.");
  }

  const passwordBytes = new TextEncoder().encode(password);

  const passwordBuffer = passwordBytes.slice().buffer;
  const saltBuffer = salt.slice().buffer;

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBuffer,
      iterations,
    },
    keyMaterial,
    HASH_LENGTH * 8,
  );

  return new Uint8Array(derivedBits);
}

function timingSafeEqual(first: Uint8Array, second: Uint8Array): boolean {
  if (first.length !== second.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < first.length; index += 1) {
    difference |= first[index] ^ second[index];
  }

  return difference === 0;
}

export function isLocalAuthConfigured(): boolean {
  return getStoredAuthRecord() !== null;
}

export async function createLocalPassword(password: string): Promise<void> {
  const normalizedPassword = password.trim();

  if (normalizedPassword.length < 6) {
    throw new Error("Your password must contain at least 6 characters.");
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const passwordHash = await derivePasswordHash(
    normalizedPassword,
    salt,
    PBKDF2_ITERATIONS,
  );

  const record: StoredAuthRecord = {
    version: 1,
    salt: bytesToBase64(salt),
    passwordHash: bytesToBase64(passwordHash),
    iterations: PBKDF2_ITERATIONS,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(record));
}

export async function verifyLocalPassword(password: string): Promise<boolean> {
  const record = getStoredAuthRecord();

  if (!record) {
    return false;
  }

  const enteredHash = await derivePasswordHash(
    password.trim(),
    base64ToBytes(record.salt),
    record.iterations,
  );

  const storedHash = base64ToBytes(record.passwordHash);

  return timingSafeEqual(enteredHash, storedHash);
}

export async function changeLocalPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const currentPasswordIsValid = await verifyLocalPassword(currentPassword);

  if (!currentPasswordIsValid) {
    throw new Error("Your current password is incorrect.");
  }

  await createLocalPassword(newPassword);
}

export function removeLocalPassword(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
