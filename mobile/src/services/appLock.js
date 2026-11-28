import storage from './storage';

const LOCK_ENABLED_KEY = 'manakbae_app_lock_enabled';
const LOCK_HASH_KEY = 'manakbae_app_lock_hash';

const listeners = new Set();

function notify(event) {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      // Ignore listener errors
    }
  });
}

// Lightweight deterministic salted hash (works synchronously across Web & React Native)
function hashSecret(raw) {
  const salted = `manakbae::lock::v1::${String(raw || '').trim()}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

export async function isAppLockEnabled() {
  const enabled = await storage.getItem(LOCK_ENABLED_KEY);
  const hash = await storage.getItem(LOCK_HASH_KEY);
  return enabled === 'true' && !!hash;
}

export async function setAppLockPassword(secret) {
  const clean = String(secret || '').trim();
  if (clean.length < 4) {
    throw new Error('Le mot de passe de sécurité doit contenir au moins 4 caractères.');
  }
  await storage.setItem(LOCK_HASH_KEY, hashSecret(clean));
  await storage.setItem(LOCK_ENABLED_KEY, 'true');
  notify('change');
}

export async function verifyAppLockPassword(candidate) {
  const stored = await storage.getItem(LOCK_HASH_KEY);
  if (!stored) return true;
  return hashSecret(candidate) === stored;
}

export async function disableAppLock() {
  await storage.deleteItem(LOCK_ENABLED_KEY);
  await storage.deleteItem(LOCK_HASH_KEY);
  notify('change');
}

export function triggerImmediateLock() {
  notify('lock');
}

export function subscribeAppLock(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
