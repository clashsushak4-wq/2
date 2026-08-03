import { mnemonicNew, mnemonicToWalletKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

/**
 * Генерирует новую сид-фразу из 24 слов.
 */
export async function generateNewWallet() {
  const mnemonic = await mnemonicNew(24);
  const keyPair = await mnemonicToWalletKey(mnemonic);
  
  // v4R2 - стандартный современный кошелек TON
  const workchain = 0; 
  const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
  
  return {
    mnemonic,
    publicKey: keyPair.publicKey.toString('hex'),
    address: wallet.address.toString({ bounceable: false })
  };
}

/**
 * Восстанавливает кошелек из сид-фразы для проверки или импорта.
 */
export async function importWallet(mnemonic: string[]) {
  const keyPair = await mnemonicToWalletKey(mnemonic);
  const workchain = 0;
  const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
  
  return {
    mnemonic,
    publicKey: keyPair.publicKey.toString('hex'),
    address: wallet.address.toString({ bounceable: false })
  };
}

// === ЛОКАЛЬНОЕ ШИФРОВАНИЕ (Web Crypto API) ===

// Константы для PBKDF2 V1 (старые)
const SALT_V1 = new TextEncoder().encode('trading-bot-salt-v1');
const ITERATIONS_V1 = 100000;

// Константы для PBKDF2 V2 (новые)
const ITERATIONS_V2 = 1000000;

async function getDerivationMaterial(pin: string) {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

// V1 Key Material (Уязвимо к rainbow-tables)
async function getKeyMaterialV1(pin: string) {
  const keyMaterial = await getDerivationMaterial(pin);
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT_V1,
      iterations: ITERATIONS_V1,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// V2 Key Material (Динамическая соль + SHA-512)
async function getKeyMaterialV2(pin: string, salt: Uint8Array) {
  const keyMaterial = await getDerivationMaterial(pin);
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS_V2,
      hash: "SHA-512"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Зашифровать сид-фразу (в виде строки) с помощью PIN-кода.
 * Формат V2: v2:base64(salt(16) + iv(12) + ciphertext)
 */
export async function encryptMnemonic(mnemonicStr: string, pin: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyMaterialV2(pin, salt);
  
  const encodedData = new TextEncoder().encode(mnemonicStr);

  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encodedData
  );

  const encryptedArray = new Uint8Array(encryptedBuf);
  const payload = new Uint8Array(salt.length + iv.length + encryptedArray.length);
  payload.set(salt, 0);
  payload.set(iv, salt.length);
  payload.set(encryptedArray, salt.length + iv.length);

  return 'v2:' + btoa(String.fromCharCode.apply(null, Array.from(payload)));
}

/**
 * Расшифровать сид-фразу с помощью PIN-кода.
 */
export async function decryptMnemonic(encryptedBase64: string, pin: string): Promise<string> {
  try {
    if (encryptedBase64.startsWith('v2:')) {
      // V2 Decryption
      const payloadStr = atob(encryptedBase64.slice(3));
      const payload = new Uint8Array(payloadStr.length);
      for (let i = 0; i < payloadStr.length; i++) {
        payload[i] = payloadStr.charCodeAt(i);
      }
      
      const salt = payload.slice(0, 16);
      const iv = payload.slice(16, 28);
      const encryptedData = payload.slice(28);

      const key = await getKeyMaterialV2(pin, salt);
      const decryptedBuf = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encryptedData
      );

      return new TextDecoder().decode(decryptedBuf);
    } else {
      // V1 Decryption (Legacy)
      const key = await getKeyMaterialV1(pin);
      const payloadStr = atob(encryptedBase64);
      const payload = new Uint8Array(payloadStr.length);
      for (let i = 0; i < payloadStr.length; i++) {
        payload[i] = payloadStr.charCodeAt(i);
      }

      const iv = payload.slice(0, 12);
      const encryptedData = payload.slice(12);

      const decryptedBuf = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encryptedData
      );

      return new TextDecoder().decode(decryptedBuf);
    }
  } catch (e) {
    throw new Error("Invalid PIN or corrupted data");
  }
}
