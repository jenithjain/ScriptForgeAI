import { GoogleGenerativeAI } from '@google/generative-ai';

// Standardize API key - check both possible env var names
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY is not defined in environment variables');
}

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Default timeout for Gemini API calls (120 seconds for complex agents)
const DEFAULT_GEMINI_TIMEOUT_MS = 120000;

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Gemini API request timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

// Reasoning/strategy: Gemini 2.5 Flash for general tasks
export const getReasoningModel = (timeoutMs: number = DEFAULT_GEMINI_TIMEOUT_MS) => {
  console.log(`[Gemini] Creating Reasoning Model with timeout: ${timeoutMs}ms`);
  return genAI.getGenerativeModel(
    {
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    },
    { timeout: timeoutMs } // Pass timeout at model creation level
  );
};

// General text: Gemini 2.5 Flash
export const getFlashModel = (timeoutMs: number = DEFAULT_GEMINI_TIMEOUT_MS) => {
  return genAI.getGenerativeModel(
    {
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.95,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    },
    { timeout: timeoutMs } // Pass timeout at model creation level
  );
};

// Knowledge Graph Model: Gemini 2.5 Pro for complex reasoning with higher token limits
export const getKnowledgeGraphModel = (timeoutMs: number = DEFAULT_GEMINI_TIMEOUT_MS) => {
  console.log(`[Gemini] Creating Knowledge Graph Model with timeout: ${timeoutMs}ms`);
  return genAI.getGenerativeModel(
    {
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.7, // Lower temperature for more structured JSON output
        topP: 0.95,
        maxOutputTokens: 32768, // Much higher limit for comprehensive graph extraction
      },
    },
    { timeout: timeoutMs } // Pass timeout at model creation level
  );
};

// Image generation: Gemini 2.5 Flash Image (returns base64 images)
export const getImageModel = (timeoutMs: number = DEFAULT_GEMINI_TIMEOUT_MS) => {
  return genAI.getGenerativeModel(
    {
      model: 'gemini-2.5-flash-image',
      generationConfig: {
        temperature: 1.1,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    },
    { timeout: timeoutMs } // Pass timeout at model creation level
  );
};

// Flexible model getter with custom config (for JSON response mode, etc.)
export const getCustomModel = (
  modelName: string = 'gemini-2.5-flash',
  generationConfig: Record<string, any> = {},
  timeoutMs: number = DEFAULT_GEMINI_TIMEOUT_MS
) => {
  return genAI.getGenerativeModel(
    {
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 8192,
        ...generationConfig, // Allow overrides
      },
    },
    { timeout: timeoutMs } // Pass timeout at model creation level
  );
};

// Helper to generate content with retry logic and timeout
// NOTE: Timeout is now configured at model creation level via getGenerativeModel()
// The timeoutMs parameter here is only used for the Promise.race wrapper as a safety net
export async function generateWithRetry(
  model: any,
  prompt: string,
  maxRetries = 3,
  timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS
): Promise<string> {
  console.log(`[Gemini] generateWithRetry called with timeout: ${timeoutMs}ms (${timeoutMs / 1000}s)`);
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // The model should already have timeout configured via getGenerativeModel()
      // We still wrap with our timeout as a safety net
      const result: any = await withTimeout(
        model.generateContent(prompt),
        timeoutMs,
        `Gemini API request timed out after ${timeoutMs}ms`
      );
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${i + 1} failed:`, error);
      
      // On timeout, try once more with same timeout (might be temporary network issue)
      // but don't retry more than once for timeouts
      if (lastError.message.includes('timed out') && i > 0) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to generate content after retries');
}

// Helper to parse JSON from Gemini response (handles markdown code blocks)
export function parseJSONFromResponse(responseText: string): any {
  // Remove markdown code blocks if present
  let cleanedText = responseText.trim();
  
  // Remove ```json and ``` markers (case insensitive)
  const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (jsonBlockMatch) {
    cleanedText = jsonBlockMatch[1].trim();
  } else {
    // Try removing simple markers
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
  }
  
  cleanedText = cleanedText.trim();
  
  // Try direct parsing first
  try {
    return JSON.parse(cleanedText);
  } catch (firstError) {
    console.log('Direct parse failed, attempting extraction...');
    
    // Find balanced JSON using brace counting
    const extractedJson = extractBalancedJson(cleanedText);
    
    if (extractedJson) {
      try {
        return JSON.parse(extractedJson);
      } catch (secondError) {
        // Try fixing common JSON issues
        const fixedJson = fixJsonString(extractedJson);
        
        try {
          return JSON.parse(fixedJson);
        } catch (thirdError) {
          console.error('Failed to parse JSON after fixes. First 1000 chars:', cleanedText.substring(0, 1000));
          return createFallbackResponse(cleanedText);
        }
      }
    }
    
    console.error('No valid JSON found in response. First 1000 chars:', cleanedText.substring(0, 1000));
    return createFallbackResponse(cleanedText);
  }
}

// Extract balanced JSON by counting braces
function extractBalancedJson(text: string): string | null {
  // Find the first { or [
  const objectStart = text.indexOf('{');
  const arrayStart = text.indexOf('[');
  
  let startIndex = -1;
  let openChar = '{';
  let closeChar = '}';
  
  if (objectStart === -1 && arrayStart === -1) {
    return null;
  } else if (objectStart === -1) {
    startIndex = arrayStart;
    openChar = '[';
    closeChar = ']';
  } else if (arrayStart === -1) {
    startIndex = objectStart;
  } else {
    // Use whichever comes first
    if (objectStart < arrayStart) {
      startIndex = objectStart;
    } else {
      startIndex = arrayStart;
      openChar = '[';
      closeChar = ']';
    }
  }
  
  // Count braces to find the matching close
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === openChar || char === '{' || char === '[') {
      depth++;
    } else if (char === closeChar || char === '}' || char === ']') {
      depth--;
      if (depth === 0) {
        return text.substring(startIndex, i + 1);
      }
    }
  }
  
  // If we couldn't find balanced braces, return everything from start
  // This handles truncated responses
  return text.substring(startIndex);
}

// Fix common JSON issues
function fixJsonString(json: string): string {
  return json
    // Remove trailing commas before } or ]
    .replace(/,(\s*[}\]])/g, '$1')
    // Remove any text after the last } or ]
    .replace(/([}\]])([^}\]]*$)/, '$1')
    // Fix unquoted keys (simple cases)
    .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)\1?\s*:/g, '"$2":')
    // Remove duplicate quotes on keys
    .replace(/""+/g, '"');
}

// Extract partial data from truncated JSON responses
function extractPartialData(rawText: string): any {
  const result: any = { hasData: false };
  
  // Helper to extract complete array items from truncated response
  const extractArrayItems = (text: string, key: string): any[] => {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[`, 'i');
    const match = text.match(regex);
    if (!match) return [];
    
    const startIdx = match.index! + match[0].length;
    const items: any[] = [];
    let depth = 1;
    let itemStart = startIdx;
    let inString = false;
    let escapeNext = false;
    let braceDepth = 0;
    
    for (let i = startIdx; i < text.length && depth > 0; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (inString) continue;
      
      if (char === '{') {
        if (braceDepth === 0) itemStart = i;
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          // Complete object found
          const itemText = text.substring(itemStart, i + 1);
          try {
            const item = JSON.parse(itemText);
            items.push(item);
          } catch (e) {
            // Try to fix and parse
            try {
              const fixed = fixJsonString(itemText);
              const item = JSON.parse(fixed);
              items.push(item);
            } catch (e2) {
              // Skip malformed item
            }
          }
        }
      } else if (char === '[') {
        depth++;
      } else if (char === ']') {
        depth--;
      }
    }
    
    return items;
  };
  
  // Try to extract each type of data
  const characters = extractArrayItems(rawText, 'characters');
  if (characters.length > 0) {
    result.characters = characters;
    result.hasData = true;
  }
  
  const locations = extractArrayItems(rawText, 'locations');
  if (locations.length > 0) {
    result.locations = locations;
    result.hasData = true;
  }
  
  const objects = extractArrayItems(rawText, 'objects');
  if (objects.length > 0) {
    result.objects = objects;
    result.hasData = true;
  }
  
  const events = extractArrayItems(rawText, 'events');
  if (events.length > 0) {
    result.events = events;
    result.hasData = true;
  }
  
  const relationships = extractArrayItems(rawText, 'relationships');
  if (relationships.length > 0) {
    result.relationships = relationships;
    result.hasData = true;
  }
  
  const plotThreads = extractArrayItems(rawText, 'plotThreads');
  if (plotThreads.length > 0) {
    result.plotThreads = plotThreads;
    result.hasData = true;
  }
  
  const chronologicalEvents = extractArrayItems(rawText, 'chronologicalEvents');
  if (chronologicalEvents.length > 0) {
    result.chronologicalEvents = chronologicalEvents;
    result.hasData = true;
  }
  
  console.log('Extracted partial data:', {
    characters: result.characters?.length || 0,
    locations: result.locations?.length || 0,
    objects: result.objects?.length || 0,
    events: result.events?.length || 0,
    relationships: result.relationships?.length || 0,
    plotThreads: result.plotThreads?.length || 0
  });
  
  return result;
}

// Create a fallback response when JSON parsing fails
function createFallbackResponse(rawText: string): any {
  // Detect the type of agent response expected and return appropriate fallback
  const lowerText = rawText.toLowerCase();
  
  // Store more of the raw response for debugging
  const truncatedRaw = rawText.length > 3000 ? rawText.substring(0, 3000) + '...[truncated]' : rawText;
  
  // Try to extract partial data from truncated responses
  const partialData = extractPartialData(rawText);
  
  // Check for Knowledge Graph response
  if (lowerText.includes('"characters"') || lowerText.includes('"locations"') || lowerText.includes('"plotthreads"')) {
    return {
      characters: partialData.characters || [],
      locations: partialData.locations || [],
      objects: partialData.objects || [],
      events: partialData.events || [],
      relationships: partialData.relationships || [],
      plotThreads: partialData.plotThreads || [],
      _parseError: partialData.hasData ? false : true,
      _partialExtraction: partialData.hasData,
      _errorMessage: partialData.hasData 
        ? 'Partial data extracted from truncated response' 
        : 'The AI returned an incomplete or malformed JSON response. Please try running the agent again.',
      _rawResponse: truncatedRaw
    };
  }
  
  if (lowerText.includes('chronological') || lowerText.includes('timeline') || lowerText.includes('temporal')) {
    return {
      chronologicalEvents: partialData.chronologicalEvents || [],
      flashbacks: [],
      flashForwards: [],
      causalChains: [],
      temporalIssues: [],
      storyDuration: 'Unable to determine - parsing failed',
      narrativePace: 'Unable to analyze - parsing failed',
      _parseError: true,
      _errorMessage: 'The AI returned an incomplete or malformed JSON response. Please try running the agent again.',
      _rawResponse: truncatedRaw
    };
  }
  
  if (lowerText.includes('contradiction') || lowerText.includes('continuity')) {
    return {
      contradictions: [],
      intentionalChoices: [],
      errors: [],
      warnings: ['Failed to parse AI response properly'],
      continuityScore: 0,
      recommendations: ['Please try running the agent again'],
      _parseError: true,
      _errorMessage: 'The AI returned an incomplete or malformed JSON response.',
      _rawResponse: truncatedRaw
    };
  }
  
  // Generic fallback
  return {
    error: 'Failed to parse response',
    _parseError: true,
    _errorMessage: 'The AI returned an unexpected response format.',
    _rawResponse: truncatedRaw
  };
}

export default genAI;
