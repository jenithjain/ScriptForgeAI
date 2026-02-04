import { NextResponse } from 'next/server';
import { getReasoningModel, generateWithRetry, parseJSONFromResponse } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { brief } = await request.json();

    if (!brief || typeof brief !== 'string' || brief.trim().length === 0) {
      return NextResponse.json(
        { error: 'Campaign brief is required' },
        { status: 400 }
      );
    }

    const model = getReasoningModel();

    const systemPrompt = `You are a highly experienced Chief Marketing Officer and Brand Strategist with expertise in creating comprehensive marketing campaigns across all industries and demographics.

Your task is to analyze the user's campaign brief and formulate a strategic foundation for their marketing campaign.

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or explanatory text.

The JSON object must have exactly two fields:
1. "title": A concise, compelling campaign name (3-7 words maximum) that captures the essence of the campaign
2. "rationale": A detailed strategic analysis in HTML format that includes:
   - Target Audience Analysis (demographics, psychographics, pain points, desires)
   - Core Strategic Concept (the big idea that connects product to audience)
   - Key Messaging Pillars (3-5 main themes)
   - Brand Tone & Voice guidelines
   - Channel Strategy recommendations
   - Success Metrics to track

The rationale should be formatted as clean HTML with <h3> tags for sections, <p> tags for paragraphs, <ul> and <li> for lists, and <strong> for emphasis.

User's Campaign Brief:
${brief}

Respond with ONLY the JSON object:`;

    const responseText = await generateWithRetry(model, systemPrompt);
    const parsedResponse = parseJSONFromResponse(responseText);

    // Validate the response structure
    if (!parsedResponse.title || !parsedResponse.rationale) {
      throw new Error('Invalid response structure from AI model');
    }

    return NextResponse.json({
      title: parsedResponse.title,
      rationale: parsedResponse.rationale,
    });

  } catch (error) {
    console.error('Error generating strategy:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate campaign strategy',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
