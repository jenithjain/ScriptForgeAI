import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  hasUserGeminiKey,
  saveUserGeminiKey,
  deleteUserGeminiKey,
} from '@/lib/api-key-utils';

/**
 * GET /api/user/api-key
 * Check whether the logged-in user has a stored Gemini API key.
 * Returns { hasKey: boolean } – never returns the actual key.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasKey = await hasUserGeminiKey(session);
  return NextResponse.json({ hasKey });
}

/**
 * POST /api/user/api-key
 * Store a Gemini API key for the logged-in user.
 * Body: { apiKey: string }
 *
 * Validates the key by making a lightweight test call before saving.
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { apiKey } = body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return NextResponse.json(
      { error: 'A valid API key is required' },
      { status: 400 }
    );
  }

  const trimmedKey = apiKey.trim();

  // Validate key by making a tiny test request to Gemini
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const testClient = new GoogleGenerativeAI(trimmedKey);
    const model = testClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Say "OK"');
    const text = result.response.text();
    if (!text) throw new Error('Empty response');
  } catch (err) {
    console.error('[api-key] Validation failed:', err?.message);
    return NextResponse.json(
      { error: 'Invalid API key – could not authenticate with Google Gemini' },
      { status: 422 }
    );
  }

  // Key is valid – encrypt & store
  await saveUserGeminiKey(session.user.email, trimmedKey);

  return NextResponse.json({ success: true, message: 'API key saved securely' });
}

/**
 * DELETE /api/user/api-key
 * Remove the logged-in user's stored Gemini API key.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await deleteUserGeminiKey(session.user.email);
  return NextResponse.json({ success: true, message: 'API key removed' });
}
