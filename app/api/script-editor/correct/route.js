import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

    // Use a model capable of strict instruction following
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro', // Using 2.5 Pro for better instruction following than Flash
      generationConfig: {
        temperature: 0.0,
        responseMimeType: "application/json",
      }
    });

    const systemPrompt = `You are an AI Script Correction Engine.
Your goal is to REWRITE the input script text to fix the described issue.

INPUT:
1. Issue: A description of what is wrong.
2. Text: The segment of the script containing the error (usually a full sentence or paragraph).

OUTPUT:
A JSON object with an "edits" array.

STRICT RULES:
1. "original_text": Must match the input "Text" exactly.
2. "new_text": Must be the FULLY REWRITTEN version of the input "Text".
   - Do NOT return just the changed word.
   - Do NOT return a snippet.
   - You MUST include the parts of the sentence/paragraph that did not change.
   - The result should be a complete valid substitute for the original text.

EXAMPLE 1 (Replacement):
Input Issue: "Character name typo, should be SARAH"
Input Text: "SARA walks into the room looking tired."
Output:
{
  "edits": [
    {
      "type": "replace",
      "original_text": "SARA walks into the room looking tired.",
      "new_text": "SARAH walks into the room looking tired."
    }
  ]
}

EXAMPLE 2 (Rewording):
Input Issue: "Too passive"
Input Text: "The ball was thrown by John. He smiled."
Output:
{
  "edits": [
    {
      "type": "replace",
      "original_text": "The ball was thrown by John. He smiled.",
      "new_text": "John threw the ball. He smiled."
    }
  ]
}

Result MUST be valid JSON.
`;

    const userPrompt = `
Input:
Issue: ${issue}
Text: ${text}
`;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = result.response;
    const textResponse = response.text();
    
    // Parse JSON
    let jsonResponse;
    try {
        const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        jsonResponse = JSON.parse(cleanedText);
        
        // Normalize keys and ensure string types
        if (jsonResponse.edits) {
            jsonResponse.edits = jsonResponse.edits.map(edit => {
                let newText = edit.new_text || edit.newText || edit.replacement || edit.fix || edit.corrected_text || '';
                
                // FINAL SAFETY CHECK: If the AI puts JSON in the string, try to unwrap it server-side
                if (typeof newText === 'string' && newText.trim().startsWith('{') && newText.trim().endsWith('}')) {
                     try {
                        const inner = JSON.parse(newText);
                        if (inner.new_text) newText = inner.new_text;
                        else if (inner.text) newText = inner.text;
                        // If it's a complex object we don't understand, keep original or fail? 
                        // Let's assume if it looks like JSON, we want the value of the first likely key
                        else {
                           const values = Object.values(inner);
                           if (values.length === 1 && typeof values[0] === 'string') newText = values[0];
                        }
                     } catch (e) { /* invalid json, treat as text */ }
                }

                return {
                    type: edit.type || 'replace',
                    original_text: edit.original_text || edit.originalText || edit.old_text || text, 
                    new_text: newText
                };
            });
        }
    } catch (e) {
        console.error("Failed to parse JSON response:", textResponse);
        return NextResponse.json({ error: 'Invalid JSON response from AI', raw: textResponse }, { status: 500 });
    }

    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error('Correction Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
