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

// Константы для PBKDF2 (чтобы брутфорс PIN-кода был медленнее)
const SALT = new TextEncoder().encode('trading-bot-salt-v1');
const ITERATIONS = 100000;

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

async function getKeyMaterial(pin: string) {
  const keyMaterial = await getDerivationMaterial(pin);
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT,
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Зашифровать сид-фразу (в виде строки) с помощью PIN-кода.
 */
export async function encryptMnemonic(mnemonicStr: string, pin: string): Promise<string> {
  const key = await getKeyMaterial(pin);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(mnemonicStr);

  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encodedData
  );

  // Сохраняем IV вместе с зашифрованными данными (iv + encryptedData)
  const encryptedArray = new Uint8Array(encryptedBuf);
  const payload = new Uint8Array(iv.length + encryptedArray.length);
  payload.set(iv, 0);
  payload.set(encryptedArray, iv.length);

  // Конвертируем в base64 для хранения в localStorage
  return btoa(String.fromCharCode.apply(null, Array.from(payload)));
}

/**
 * Расшифровать сид-фразу с помощью PIN-кода.
 */
export async function decryptMnemonic(encryptedBase64: string, pin: string): Promise<string> {
  try {
    const key = await getKeyMaterial(pin);
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
  } catch (e) {
    throw new Error("Invalid PIN or corrupted data");
  }
}
