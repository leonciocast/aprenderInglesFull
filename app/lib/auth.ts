import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const HASH_PREFIX = 'scrypt';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [prefix, salt, hash] = stored.split('$');
  if (prefix !== HASH_PREFIX || !salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hash, 'hex');
  if (storedBuf.length !== derived.length) return false;
  return timingSafeEqual(storedBuf, derived);
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
