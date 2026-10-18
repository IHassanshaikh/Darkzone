/**
 * ReliefOS + DARK ZONE: Web Crypto API Mesh Encryption Module
 * Implements real ECDH P-256 Key Agreement & AES-GCM 256-bit Authenticated Encryption
 * Demonstrates end-to-end encryption from sender to gateway across zero-trust relays.
 */

// Helper to convert ArrayBuffer to Hex string
export function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert Hex string to Uint8Array
export function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Generates an ECDH P-256 Key Pair for a mesh node
 */
export async function generateNodeKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );

  // Export raw public key for exchange
  const rawPublic = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyHex = bufferToHex(rawPublic);

  return {
    keyPair,
    publicKeyHex
  };
}

/**
 * Derives a shared AES-GCM key using ECDH
 */
async function deriveSharedKey(privateKey, publicKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext message for the recipient node using ECDH + AES-GCM
 */
export async function encryptMeshMessage(plaintext, senderPrivateKey, recipientPublicKey) {
  const sharedKey = await deriveSharedKey(senderPrivateKey, recipientPublicKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    sharedKey,
    encodedData
  );

  return {
    ciphertextHex: bufferToHex(ciphertextBuffer),
    ivHex: bufferToHex(iv),
    timestamp: new Date().toISOString()
  };
}

/**
 * Decrypts a ciphertext message at the recipient node using ECDH + AES-GCM
 */
export async function decryptMeshMessage(ciphertextHex, ivHex, recipientPrivateKey, senderPublicKey) {
  try {
    const sharedKey = await deriveSharedKey(recipientPrivateKey, senderPublicKey);
    const iv = hexToBuffer(ivHex);
    const ciphertext = hexToBuffer(ciphertextHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      sharedKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed at Gateway:', err);
    throw new Error('Decryption failed: Invalid key or corrupted packet');
  }
}
