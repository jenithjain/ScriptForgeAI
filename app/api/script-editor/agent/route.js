
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getCustomModel } from '@/lib/gemini';

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

    // Use Gemini flash for speed/quality balance (with 120s timeout)
    const model = getCustomModel('gemini-2.0-flash', {
      temperature: 0.7, // Allow some creativity for rewriting
      responseMimeType: "application/json",
    });

    const systemPrompt = `You are an AI Creative Co-Author and Script Doctor.
You help users with their screenplay — either by editing it or by answering questions about it.

INPUT:
1. Instruction: The user's request.
2. Script Content: The current full text of the script.

STEP 1 — CLASSIFY INTENT:
Determine if the user wants you to EDIT the script or just EXPLAIN/ANSWER something.

EDIT intents: "Make the dialogue more snappy", "Change the location to a rooftop", "Fix the pacing", "Rewrite this scene", "Add more detail to..."
EXPLAIN intents: "Explain this paragraph", "What does this mean?", "Summarize the plot", "Who is this character?", "Why is this scene important?", "Analyze the tone", "Tell me about..."

STEP 2 — RESPOND:

If intent is EXPLAIN (user is asking a question, NOT requesting changes):
{
  "intent": "explain",
  "explanation": "Your detailed answer to the user's question in plain text. Use markdown formatting if helpful.",
  "changes": []
}

If intent is EDIT (user wants you to modify the script):
{
  "intent": "edit",
  "explanation": "",
  "changes": [
    {
      "type": "replace",
      "explanation": "Brief explanation of the change",
      "original_text": "The EXACT text block from the script that is being replaced. Must match perfectly.",
      "new_text": "The fully rewritten text block."
    }
  ]
}

RULES:
- ALWAYS classify intent first. If the user is asking a question, NEVER return changes.
- If the instruction implies rewriting the WHOLE script (unlikely but possible), do so.
- If it implies a specific scene, only return that scene's text in 'original_text'.
- "original_text" should be substantial enough to be unique (at least a full line or paragraph).
- Do not make changes that were not requested.
- If the instruction is "Fix the typo in line 5", find the text corresponding to what looks like line 5 content (contextual) and fix it.
`;

    const userPrompt = `
INSTRUCTION: ${instruction}

SCRIPT CONTENT:
"""
${scriptContent}
"""
`;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    const jsonString = response.text();

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonString);
    } catch (e) {
      // Fallback or retry logic could go here
      console.error("Agent Parse Error", e);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json(parsedResult);

  } catch (error) {
    console.error('Agent API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
