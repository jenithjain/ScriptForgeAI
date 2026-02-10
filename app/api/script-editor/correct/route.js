import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { safeGenerateObject, z } from '@/lib/ai-provider';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issue, text } = await request.json();

    if (!issue || !text) {
      return NextResponse.json({ error: 'Missing issue or text' }, { status: 400 });
    }

    // Zod schema guarantees valid structured output
    const CorrectionSchema = z.object({
      edits: z.array(z.object({
        type: z.literal('replace'),
        original_text: z.string().describe('Must match the input text exactly'),
        new_text: z.string().describe('The FULLY REWRITTEN version of the input text — not just the changed word, but the complete substitute'),
      })),
    });

    const prompt = `You are an AI Script Correction Engine.
Your goal is to REWRITE the input script text to fix the described issue.

STRICT RULES:
1. "original_text": Must match the input "Text" exactly.
2. "new_text": Must be the FULLY REWRITTEN version of the input "Text".
   - Do NOT return just the changed word.
   - Do NOT return a snippet.
   - You MUST include the parts of the sentence/paragraph that did not change.
   - The result should be a complete valid substitute for the original text.

HANDLING CONSISTENCY ISSUES:
- If the Issue describes a contradiction (e.g., "X was A before, but B now"), resolve it by modifying the current "Text" to be consistent.

Issue: ${issue}
Text: ${text}`;

    const { object, success, error } = await safeGenerateObject(
      prompt,
      CorrectionSchema,
      { model: 'flash', temperature: 0.0, timeout: 120000 }
    );

    if (!success || !object) {
      console.error('Correction generation failed:', error);
      return NextResponse.json({ error: 'AI correction failed', details: error }, { status: 500 });
    }

    return NextResponse.json(object);

  } catch (error) {
    console.error('Correction Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
