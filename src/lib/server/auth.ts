import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { db } from './db';
import { appSettings } from './db/schema';
import { eq } from 'drizzle-orm';

type PasswordRecord = {
  algorithm: 'pbkdf2_sha256';
  salt: string;
  hash: string;
};

const PASSWORD_KEY = 'admin_password';

function serializePassword(rec: PasswordRecord): string {
  return `${rec.algorithm}:${rec.salt}:${rec.hash}`;
}

function deserializePassword(stored: string): PasswordRecord | null {
  const parts = stored.split(':');
  if (parts.length !== 3) return null;
  const [algorithm, salt, hash] = parts as [PasswordRecord['algorithm'], string, string];
  if (algorithm !== 'pbkdf2_sha256') return null;
  return { algorithm, salt, hash };
}

function hashPasswordWithSalt(password: string, salt: string): string {
  const derived = pbkdf2Sync(password, salt, 120000, 32, 'sha256');
  return derived.toString('hex');
}

export async function isPasswordSet(): Promise<boolean> {
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, PASSWORD_KEY)).limit(1);
  return rows.length > 0;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, PASSWORD_KEY)).limit(1);
  if (rows.length === 0) {
    // No password set yet: treat as not verified
    return false;
  }
  const rec = deserializePassword(rows[0].value);
  if (!rec) return false;
  const computed = hashPasswordWithSalt(password, rec.salt);
  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(rec.hash, 'hex'));
  } catch {
    return false;
  }
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const salt = randomBytes(16).toString('hex');
  const hash = hashPasswordWithSalt(newPassword, salt);
  const value = serializePassword({ algorithm: 'pbkdf2_sha256', salt, hash });

  // Upsert semantics
  const existing = await db.select().from(appSettings).where(eq(appSettings.key, PASSWORD_KEY)).limit(1);
  if (existing.length > 0) {
    await db
      .update(appSettings)
      .set({ value })
      .where(eq(appSettings.key, PASSWORD_KEY));
  } else {
    await db.insert(appSettings).values({ key: PASSWORD_KEY, value });
  }
}

export async function removeAdminPassword(): Promise<void> {
  await db.delete(appSettings).where(eq(appSettings.key, PASSWORD_KEY));
}


