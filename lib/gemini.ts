import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Reasoning/strategy: Gemini 2.5 Pro (latest premium model for best results)
export const getReasoningModel = () => {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });
};

// General text: Gemini 2.5 Pro as well (keeps quality consistent)
export const getFlashModel = () => {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.95,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });
};

// Image generation: Gemini 2.5 Flash Image (returns base64 images)
export const getImageModel = () => {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      temperature: 1.1,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
};

// Helper to generate content with retry logic
export async function generateWithRetry(
  model: any,
  prompt: string,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${i + 1} failed:`, error);
      
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

// Create a fallback response when JSON parsing fails
function createFallbackResponse(rawText: string): any {
  // Detect the type of agent response expected and return appropriate fallback
  const lowerText = rawText.toLowerCase();
  
  // Store more of the raw response for debugging
  const truncatedRaw = rawText.length > 3000 ? rawText.substring(0, 3000) + '...[truncated]' : rawText;
  
  if (lowerText.includes('chronological') || lowerText.includes('timeline') || lowerText.includes('temporal')) {
    return {
      chronologicalEvents: [],
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
