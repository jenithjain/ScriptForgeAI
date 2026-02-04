import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { runQuery } from '@/lib/neo4j';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

/**
 * AI Creative Assistant API
 * 
 * Provides intelligent creative suggestions using:
 * - Current scene text
 * - Story knowledge graph from Neo4j
 * - User intent (scene, dialogue, plot, character, theme)
 * 
 * Returns suggestions ONLY - never modifies story or writes to database
 * 
 * VIDEO GENERATION PURPOSE:
 * Video prompts are visual ideation tools for writers to:
 * - Preview scene atmosphere and mood
 * - Visualize emotional beats between characters
 * - See relationship dynamics and tone
 * NOT for final production - just quick visual references for creative inspiration
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, sceneId, currentSceneText, intent } = await request.json();

    if (!currentSceneText || !intent) {
      return NextResponse.json(
        { error: 'Missing required fields: currentSceneText and intent' },
        { status: 400 }
      );
    }

    const validIntents = ['scene', 'dialogue', 'plot', 'character', 'theme'];
    if (!validIntents.includes(intent)) {
      return NextResponse.json(
        { error: `Invalid intent. Must be one of: ${validIntents.join(', ')}` },
        { status: 400 }
      );
    }

    // Query knowledge graph for story context
    const storyContext = await getStoryContext(documentId);

    // Generate suggestions based on intent
    let suggestions;
    switch (intent) {
      case 'scene':
        suggestions = await generateSceneSuggestions(currentSceneText, storyContext);
        break;
      case 'dialogue':
        suggestions = await generateDialogueSuggestions(currentSceneText, storyContext);
        break;
      case 'plot':
        suggestions = await generatePlotSuggestions(currentSceneText, storyContext);
        break;
      case 'character':
        suggestions = await generateCharacterSuggestions(currentSceneText, storyContext);
        break;
      case 'theme':
        suggestions = await generateThemeSuggestions(currentSceneText, storyContext);
        break;
    }

    return NextResponse.json({
      success: true,
      intent,
      suggestions,
      context: {
        documentId,
        sceneId,
        timestamp: new Date().toISOString(),
        storyContextAvailable: !!(storyContext.characters.length || storyContext.plotThreads.length)
      }
    });

  } catch (error) {
    console.error('Creative Assistant Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

/**
 * Query Neo4j knowledge graph for story context
 */
async function getStoryContext(documentId) {
  try {
    // Get characters with their traits and motivations
    const characters = await runQuery(`
      MATCH (c:Character)
      OPTIONAL MATCH (c)-[:HAS_STATE]->(s:State)
      WITH c, s
      ORDER BY s.timestamp DESC
      RETURN c.id as id, c.name as name, c.role as role, 
             c.description as description,
             COLLECT(DISTINCT s.traits)[0] as traits,
             COLLECT(DISTINCT s.motivations)[0] as motivations
      LIMIT 20
    `);

    // Get locations
    const locations = await runQuery(`
      MATCH (l:Location)
      RETURN l.id as id, l.name as name, l.description as description, l.type as type
      LIMIT 15
    `);

    // Get plot threads
    const plotThreads = await runQuery(`
      MATCH (p:PlotThread)
      RETURN p.id as id, p.name as name, p.status as status,
             p.description as description
      LIMIT 10
    `);

    // Get recent events
    const recentEvents = await runQuery(`
      MATCH (e:Event)
      OPTIONAL MATCH (e)-[:INVOLVES]->(c:Character)
      RETURN e.id as id, e.name as name, e.description as description, 
             e.timestamp as timestamp, COLLECT(c.name) as characters
      ORDER BY e.timestamp DESC
      LIMIT 10
    `);

    // Get relationships
    const relationships = await runQuery(`
      MATCH (c1:Character)-[r:RELATES_TO]->(c2:Character)
      RETURN c1.name as from, c2.name as to, 
             r.type as relationType, r.description as description
      LIMIT 20
    `);

    // Get story tone/mood if available
    const storyMood = await runQuery(`
      MATCH (ch:Chapter)
      RETURN ch.mood as mood, ch.tension as tension
      ORDER BY ch.number DESC
      LIMIT 1
    `);

    return {
      characters: characters || [],
      locations: locations || [],
      plotThreads: plotThreads || [],
      recentEvents: recentEvents || [],
      relationships: relationships || [],
      currentMood: storyMood?.[0] || null
    };
  } catch (error) {
    console.error('Error fetching story context from Neo4j:', error);
    return {
      characters: [],
      locations: [],
      plotThreads: [],
      recentEvents: [],
      relationships: [],
      currentMood: null
    };
  }
}

/**
 * Generate scene suggestions with video prompts
 */
async function generateSceneSuggestions(sceneText, storyContext) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const characterList = storyContext.characters.map(c => 
    `${c.name} (${c.role || 'character'})${c.traits ? ` - traits: ${Array.isArray(c.traits) ? c.traits.join(', ') : c.traits}` : ''}`
  ).join('\n');

  const locationList = storyContext.locations.map(l => l.name).join(', ') || 'No locations tracked yet';
  
  const unresolvedPlots = storyContext.plotThreads
    .filter(p => p.status !== 'resolved')
    .map(p => p.name)
    .join(', ') || 'No active plot threads';

  const inactiveCharacters = storyContext.characters
    .filter(c => {
      const recentChars = storyContext.recentEvents.flatMap(e => e.characters || []);
      return !recentChars.includes(c.name);
    })
    .map(c => c.name)
    .join(', ') || 'All characters recently active';

  const prompt = `You are a creative writing assistant helping with scene development.

CURRENT SCENE:
${sceneText}

STORY CONTEXT FROM KNOWLEDGE GRAPH:
Characters: 
${characterList || 'No characters tracked yet'}

Available Locations: ${locationList}

Unresolved Plot Threads: ${unresolvedPlots}

Recently Inactive Characters: ${inactiveCharacters}

Current Story Mood: ${storyContext.currentMood?.mood || 'Not specified'}

YOUR TASK:
Analyze the current scene and unresolved narrative threads. Generate 3-4 diverse scene suggestions that could follow.

For EACH suggestion, provide:
1. A compelling one-sentence scene summary
2. The setting/location
3. Characters involved (from the known characters)
4. The narrative purpose (what it achieves for the story)
5. Pacing intent: "tension" (raises stakes) or "relief" (emotional breather)
6. A detailed VIDEO PROMPT for Veo 3.1 to visualize the scene atmosphere

VIDEO PROMPT GUIDELINES (for writer's visual ideation - NOT production):
- Focus on ATMOSPHERE and MOOD - help the writer SEE the feeling
- Describe lighting that conveys emotional state (warm/cold, harsh/soft)
- Include ambient elements that set tone (weather, time of day, environment)
- Capture the EMOTIONAL ESSENCE of the scene in visual terms
- Keep it evocative and atmospheric, 2-3 sentences max
- Think: "What visual would help a writer FEEL this scene?"

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "type": "sceneSuggestion",
      "summary": "Brief scene description",
      "setting": "Location name and description",
      "characters": ["Character1", "Character2"],
      "purpose": "What this scene achieves narratively",
      "pacing": "tension",
      "emotionalTone": "tense/dramatic/intimate/hopeful/melancholy/etc",
      "advancesPlot": ["plot thread 1"],
      "visualConcept": {
        "purpose": "scene atmosphere preview - visual ideation for writer",
        "videoPrompt": "Evocative atmospheric description focusing on mood, lighting, and emotional tone to help the writer visualize this scene"
      }
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parse error:', e);
    }
  }
  
  return { suggestions: [], error: 'Failed to parse suggestions' };
}

/**
 * Generate dialogue enhancement suggestions
 */
async function generateDialogueSuggestions(sceneText, storyContext) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const characterDetails = storyContext.characters.map(c => 
    `${c.name}: Role: ${c.role || 'unknown'}, Traits: ${Array.isArray(c.traits) ? c.traits.join(', ') : (c.traits || 'unknown')}, Description: ${c.description || 'Not detailed'}`
  ).join('\n');

  const relationshipDetails = storyContext.relationships.map(r =>
    `${r.from} → ${r.to}: ${r.relationType} (${r.description || 'no details'})`
  ).join('\n');

  const prompt = `You are a dialogue enhancement specialist for screenwriting.

CURRENT SCENE:
${sceneText}

CHARACTER PROFILES FROM KNOWLEDGE GRAPH:
${characterDetails || 'No character data available'}

RELATIONSHIPS:
${relationshipDetails || 'No relationships tracked'}

YOUR TASK:
Analyze the dialogue in this scene. Identify 3-4 lines that could be enhanced while preserving character voice.

For EACH suggestion:
1. Quote the original line
2. Provide an improved version with better subtext, character voice, or emotional depth
3. Name the character speaking
4. Explain why the improvement works
5. Include a VIDEO PROMPT showing the emotional beat

VIDEO PROMPT GUIDELINES (for writer's emotional beat visualization):
- Focus on the CHARACTER'S EMOTIONAL STATE - help writer see the feeling
- Body language, facial expression, physical tension or release
- Lighting that AMPLIFIES the emotion (shadows for tension, warm light for intimacy)
- Atmosphere that reflects the internal state
- This is for the WRITER to visualize the beat, not for production

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "type": "dialogueSuggestion",
      "character": "Character name",
      "originalLine": "The original dialogue",
      "suggestedLine": "The improved dialogue with better subtext",
      "reason": "Why this improvement works for the character",
      "improvementType": "subtext/voice/emotion/tension/rhythm",
      "visualConcept": {
        "purpose": "emotional beat visualization - help writer see the feeling",
        "videoPrompt": "Atmospheric visual capturing [character]'s emotional state through expression, body language, and evocative lighting/environment"
      }
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parse error:', e);
    }
  }
  
  return { suggestions: [], error: 'Failed to parse suggestions' };
}

/**
 * Generate character arc suggestions
 */
async function generateCharacterSuggestions(sceneText, storyContext) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const characterDetails = storyContext.characters.map(c => 
    `${c.name}: Role: ${c.role}, Traits: ${Array.isArray(c.traits) ? c.traits.join(', ') : (c.traits || 'unknown')}, Motivations: ${Array.isArray(c.motivations) ? c.motivations.join(', ') : (c.motivations || 'unknown')}`
  ).join('\n');

  const relationshipDetails = storyContext.relationships.map(r =>
    `${r.from} → ${r.to}: ${r.relationType}`
  ).join('\n');

  const prompt = `You are a character development specialist for screenwriting.

CURRENT SCENE:
${sceneText}

CHARACTERS FROM KNOWLEDGE GRAPH:
${characterDetails || 'No character data'}

RELATIONSHIPS:
${relationshipDetails || 'No relationships tracked'}

YOUR TASK:
Suggest 3-4 character development opportunities for this scene.

For EACH suggestion:
1. Identify the character
2. Describe the emotional beat or revelation
3. Explain how it advances their arc
4. Note relationship impacts
5. Include a VIDEO PROMPT for visualization

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "type": "characterSuggestion",
      "character": "Character name",
      "suggestionType": "emotional beat/relationship evolution/revelation/internal conflict",
      "description": "What happens in this moment",
      "arcProgress": "How this advances their character journey",
      "emotionalImpact": "high/medium/low",
      "relationshipImpact": "Which relationships are affected and how",
      "visualConcept": {
        "purpose": "character moment visualization - relationship and emotional tone preview",
        "videoPrompt": "Visual capturing [character]'s internal shift - their expression, posture, and the atmosphere around them reflecting this emotional moment"
      }
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parse error:', e);
    }
  }
  
  return { suggestions: [], error: 'Failed to parse suggestions' };
}

/**
 * Generate plot development suggestions
 */
async function generatePlotSuggestions(sceneText, storyContext) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const plotThreads = storyContext.plotThreads.map(p => 
    `${p.name}: Status: ${p.status || 'active'}, Description: ${p.description || 'No details'}`
  ).join('\n');

  const recentEvents = storyContext.recentEvents.map(e =>
    `${e.name || 'Event'}: ${e.description || 'No description'}`
  ).join('\n');

  const prompt = `You are a plot development strategist for screenwriting.

CURRENT SCENE:
${sceneText}

ACTIVE PLOT THREADS FROM KNOWLEDGE GRAPH:
${plotThreads || 'No plot threads tracked'}

RECENT STORY EVENTS:
${recentEvents || 'No events tracked'}

YOUR TASK:
Suggest 3-4 plot development opportunities that advance the story.

For EACH suggestion:
1. Describe the plot direction
2. Note which threads it advances
3. Suggest a potential twist or complication
4. Explain stakes impact
5. Include a VIDEO PROMPT for foreshadowing

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "type": "plotSuggestion",
      "direction": "Brief description of plot development",
      "plotThreads": ["thread1", "thread2"],
      "twist": "Optional twist or complication to consider",
      "stakesImpact": "How this raises or changes the stakes",
      "pacing": "accelerate/maintain/decelerate",
      "visualConcept": {
        "purpose": "plot atmosphere preview - tone and tension visualization",
        "videoPrompt": "Atmospheric visual that captures the FEELING of this plot direction - mood, tension level, and emotional undertone for writer ideation"
      }
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parse error:', e);
    }
  }
  
  return { suggestions: [], error: 'Failed to parse suggestions' };
}

/**
 * Generate theme suggestions
 */
async function generateThemeSuggestions(sceneText, storyContext) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a thematic analysis specialist for screenwriting.

CURRENT SCENE:
${sceneText}

STORY ELEMENTS:
Characters: ${storyContext.characters.map(c => c.name).join(', ') || 'Unknown'}
Locations: ${storyContext.locations.map(l => l.name).join(', ') || 'Unknown'}
Plot Threads: ${storyContext.plotThreads.map(p => p.name).join(', ') || 'Unknown'}
Current Mood: ${storyContext.currentMood?.mood || 'Not specified'}

YOUR TASK:
Identify thematic opportunities in this scene. Suggest 3-4 ways to reinforce or explore themes.

For EACH suggestion:
1. Name the theme
2. Describe its current presence
3. Suggest enhancement methods
4. Recommend symbolic elements
5. Include a VIDEO PROMPT for thematic visualization

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "type": "themeSuggestion",
      "theme": "Theme name (e.g., 'redemption', 'loss of innocence', 'power corrupts')",
      "currentPresence": "How this theme is currently present in the scene",
      "enhancement": "Specific ways to strengthen this theme",
      "symbolism": "Symbolic elements that could reinforce this theme",
      "visualConcept": {
        "purpose": "thematic visualization - symbolic mood preview for writer",
        "videoPrompt": "Evocative visual metaphor or symbolic imagery that helps the writer FEEL and SEE this theme in action"
      }
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parse error:', e);
    }
  }
  
  return { suggestions: [], error: 'Failed to parse suggestions' };
}
