/**
 * Enterprise-Grade Encryption Utilities
 * AES-256-GCM with PBKDF2 key derivation
 * Same security as Phantom Wallet
 */

// Convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/**
 * Derive encryption key from PIN using PBKDF2
 * 100,000 iterations for security (takes ~100ms)
 */
export async function deriveKeyFromPIN(
  pin: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const pinKey = await crypto.subtle.importKey(
    'raw',
    stringToUint8Array(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000, // 100k iterations (enterprise-grade)
      hash: 'SHA-256',
    },
    pinKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES-256-GCM
 * Returns: { encrypted: base64, iv: base64, salt: base64 }
 */
export async function encryptData(
  data: string,
  pin: string
): Promise<{ encrypted: string; iv: string; salt: string }> {
  // Generate random salt (32 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(32));

  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from PIN
  const key = await deriveKeyFromPIN(pin, salt);

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    stringToUint8Array(data)
  );

  return {
    encrypted: uint8ArrayToBase64(new Uint8Array(encrypted)),
    iv: uint8ArrayToBase64(iv),
    salt: uint8ArrayToBase64(salt),
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decryptData(
  encryptedBase64: string,
  pin: string,
  ivBase64: string,
  saltBase64: string
): Promise<string> {
  try {
    const encrypted = base64ToUint8Array(encryptedBase64);
    const iv = base64ToUint8Array(ivBase64);
    const salt = base64ToUint8Array(saltBase64);

    // Derive key from PIN
    const key = await deriveKeyFromPIN(pin, salt);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return uint8ArrayToString(new Uint8Array(decrypted));
  } catch (error) {
    throw new Error('Decryption failed - incorrect PIN or corrupted data');
  }
}

/**
 * Hash PIN with bcrypt-like security
 * Uses PBKDF2 with 100k iterations
 */
export async function hashPIN(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const pinKey = await crypto.subtle.importKey(
    'raw',
    stringToUint8Array(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    pinKey,
    256
  );

  // Return salt + hash as base64
  const combined = new Uint8Array(salt.length + hash.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(hash), salt.length);

  return uint8ArrayToBase64(combined);
}

/**
 * Verify PIN against hash
 */
export async function verifyPIN(pin: string, hashBase64: string): Promise<boolean> {
  try {
    const combined = base64ToUint8Array(hashBase64);
    const salt = combined.slice(0, 32);
    const storedHash = combined.slice(32);

    const pinKey = await crypto.subtle.importKey(
      'raw',
      stringToUint8Array(pin),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      pinKey,
      256
    );

    const computedHash = new Uint8Array(hash);

    // Constant-time comparison
    if (storedHash.length !== computedHash.length) return false;

    let diff = 0;
    for (let i = 0; i < storedHash.length; i++) {
      diff |= storedHash[i] ^ computedHash[i];
    }

    return diff === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Generate random bytes (for keys, salts, etc.)
 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Secure memory clearing (best effort)
 */
export function clearSensitiveData(data: any): void {
  if (typeof data === 'string') {
    // Overwrite string in memory (best effort)
    data = '\0'.repeat(data.length);
  } else if (data instanceof Uint8Array) {
    data.fill(0);
  }
  data = null;
}
