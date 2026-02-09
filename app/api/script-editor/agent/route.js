
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
Your goal is to help the user edit their screenplay based on natural language instructions.

INPUT:
1. Instruction: The user's request (e.g., "Make the dialogue more snappy", "Change the location to a rooftop", "Fix the pacing").
2. Script Content: The current full text of the script.

PROCESS:
1. Analyze the Instruction and the Script.
2. Identify the specific section(s) that need to change.
3. Rewrite those sections.

OUTPUT:
Return a JSON object with a "changes" array. multiple independent changes can be returned.

SCHEMA:
{
  "changes": [
    {
      "type": "replace", 
      "explanation": "Brief explanation of the change",
      "original_text": "The EXACT text block from the script that is being replaced. Must match perfectly including whitespace if possible, or be distinct enough to find.",
      "new_text": "The fully rewritten text block."
    }
  ]
}

RULES:
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
