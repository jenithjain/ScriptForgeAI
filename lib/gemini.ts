import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Reasoning/strategy: Gemini 2.5 Pro (latest premium model for best results)
export const getReasoningModel = () => {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
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
    model: 'gemini-2.5-pro',
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
  
  // Remove ```json and ``` markers
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.slice(7);
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.slice(3);
  }
  
  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(0, -3);
  }
  
  cleanedText = cleanedText.trim();
  
  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse JSON:', cleanedText);
    throw new Error('Invalid JSON response from AI model');
  }
}

export default genAI;
