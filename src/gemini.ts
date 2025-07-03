import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Env } from './types';

// 调整Prompt以更好地适配Gemini
const GEMINI_PROMPT = `
As an expert web content analyst, your task is to analyze the provided article text and return a structured JSON object.

The JSON object must contain the following three fields:
1.  "title": A concise, descriptive title for the article, written in the same language as the original text.
2.  "summary": A summary of the article, 3-5 sentences long, also in the original language.
3.  "tags": An array of 3-5 relevant keywords or short phrases that best describe the article's content.

Your response should only be the raw JSON object, without any surrounding text, explanations, or markdown formatting.

Example:
{
  "title": "Example Title",
  "summary": "This is an example summary of the article content.",
  "tags": ["Example", "Technology", "AI"]
}
`;

interface AiResponse {
  title: string;
  summary: string;
  tags: string[];
}

export async function processContentWithAI(content: string, env: Env): Promise<AiResponse> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Using a fast and capable model
    safetySettings: [ // Adjust safety settings to be less restrictive for web content
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
    ],
  });

  try {
    const result = await model.generateContent(GEMINI_PROMPT + "\n\nArticle Text:\n" + content);
    const response = result.response;
    const text = response.text();

    // 从返回的文本中提取JSON字符串
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini API did not return a valid JSON object.');
    }
    
    const jsonString = jsonMatch[0];
    const parsedResult: AiResponse = JSON.parse(jsonString);
    return parsedResult;

  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    // Check for specific safety-related blocking
    if (error.message.includes('response was blocked')) {
        throw new Error('Failed to get response from Gemini: The request was blocked due to safety settings.');
    }
    throw new Error(`Failed to get response from Gemini: ${error.message}`);
  }
}
