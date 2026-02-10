
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

    const { instruction, scriptContent } = await request.json();

    if (!instruction || !scriptContent) {
      return NextResponse.json({ error: 'Missing instruction or script content' }, { status: 400 });
    }

    // Zod schema guarantees the AI returns valid structured JSON
    const AgentResponseSchema = z.object({
      intent: z.enum(['edit', 'explain']).describe('Whether the user wants to edit the script or just get an explanation'),
      explanation: z.string().describe('Plain text answer when intent is explain, empty string when intent is edit'),
      changes: z.array(z.object({
        type: z.literal('replace'),
        explanation: z.string().describe('Brief explanation of the change'),
        original_text: z.string().describe('The EXACT text block from the script being replaced'),
        new_text: z.string().describe('The fully rewritten text block'),
      })).describe('Array of changes when intent is edit, empty array when intent is explain'),
    });

    const prompt = `You are an AI Creative Co-Author and Script Doctor.
You help users with their screenplay — either by editing it or by answering questions about it.

STEP 1 — CLASSIFY INTENT:
Determine if the user wants you to EDIT the script or just EXPLAIN/ANSWER something.

EDIT intents: "Make the dialogue more snappy", "Change the location to a rooftop", "Fix the pacing", "Rewrite this scene", "Add more detail to..."
EXPLAIN intents: "Explain this paragraph", "What does this mean?", "Summarize the plot", "Who is this character?", "Why is this scene important?", "Analyze the tone", "Tell me about..."

RULES:
- ALWAYS classify intent first. If the user is asking a question, set intent to "explain" and put your answer in "explanation". Leave "changes" empty.
- If the user wants edits, set intent to "edit" and put changes in the "changes" array. Leave "explanation" empty.
- "original_text" should be substantial enough to be unique (at least a full line or paragraph).
- Do not make changes that were not requested.

INSTRUCTION: ${instruction}

SCRIPT CONTENT:
"""
${scriptContent}
"""`;

    const { object, success, error } = await safeGenerateObject(
      prompt,
      AgentResponseSchema,
      { model: 'flash', temperature: 0.7, timeout: 120000 }
    );

    if (!success || !object) {
      console.error('Agent generation failed:', error);
      return NextResponse.json({ error: 'AI generation failed', details: error }, { status: 500 });
    }

    return NextResponse.json(object);

  } catch (error) {
    console.error('Agent API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
