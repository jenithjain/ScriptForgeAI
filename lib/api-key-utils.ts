/**
 * API Key Utilities
 * 
 * Handles encryption/decryption of user API keys stored in MongoDB,
 * and provides helpers to retrieve a user's Gemini API key for per-request usage.
 */

import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

// ============================================================================
// ENCRYPTION / DECRYPTION (AES-256-GCM)
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV
const TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Derive a 256-bit encryption key from NEXTAUTH_SECRET.
 * Uses PBKDF2 with a fixed salt so the same secret always produces the same key.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for API key encryption');
  }
  // Fixed salt – acceptable because the secret itself has high entropy
  return crypto.pbkdf2Sync(secret, 'scriptforge-api-keys', 100_000, 32, 'sha256');
}

/**
 * Encrypt a plaintext API key.
 * Returns a Base64 string containing IV + ciphertext + auth tag.
 */
export function encryptApiKey(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  // Pack: iv (hex) + ':' + encrypted (hex) + ':' + tag (hex)
  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypt a stored API key string back to plaintext.
 */
export function decryptApiKey(stored: string): string {
  const key = getEncryptionKey();
  const [ivHex, encryptedHex, tagHex] = stored.split(':');

  if (!ivHex || !encryptedHex || !tagHex) {
    throw new Error('Malformed encrypted API key');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ============================================================================
// USER API KEY HELPERS
// ============================================================================

/**
 * Retrieve the decrypted Gemini API key for the current session user.
 * Falls back to the server-level env var if the user has no stored key.
 *
 * @returns The API key string, or null if neither user key nor env var exist.
 */
export async function getUserGeminiKey(
  session?: { user?: { email?: string | null } } | null
): Promise<string | null> {
  // 1. Try to get user's personal key from DB
  if (session?.user?.email) {
    try {
      await dbConnect();
      const user = await User.findOne({ email: session.user.email })
        .select('+apiKeys.gemini')
        .lean();

      if (user?.apiKeys?.gemini) {
        return decryptApiKey(user.apiKeys.gemini);
      }
    } catch (err) {
      console.error('[api-key-utils] Failed to retrieve user API key:', err);
    }
  }

  // 2. Fall back to server env var
  return process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || null;
}

/**
 * Check whether the current user has a stored Gemini API key (without decrypting).
 */
export async function hasUserGeminiKey(
  session?: { user?: { email?: string | null } } | null
): Promise<boolean> {
  if (!session?.user?.email) return false;

  try {
    await dbConnect();
    const user = await User.findOne({ email: session.user.email })
      .select('+apiKeys.gemini')
      .lean();
    return !!(user?.apiKeys?.gemini);
  } catch {
    return false;
  }
}

/**
 * Store an encrypted Gemini API key for the given user.
 */
export async function saveUserGeminiKey(email: string, apiKey: string): Promise<void> {
  await dbConnect();
  const encrypted = encryptApiKey(apiKey);
  await User.updateOne(
    { email },
    { $set: { 'apiKeys.gemini': encrypted, updatedAt: new Date() } }
  );
}

/**
 * Remove a user's stored Gemini API key.
 */
export async function deleteUserGeminiKey(email: string): Promise<void> {
  await dbConnect();
  await User.updateOne(
    { email },
    { $unset: { 'apiKeys.gemini': 1 }, $set: { updatedAt: new Date() } }
  );
}
