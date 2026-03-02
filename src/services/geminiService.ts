import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface AIInsight {
  id: string;
  title: string;
  type: 'merit' | 'demerit';
  category: string;
  content: string;
  impact_level: 'High' | 'Medium' | 'Low';
}

export async function fetchAIInsights(count: number = 5, existingIds: string[] = []): Promise<AIInsight[]> {
  const ai = getAI();
  const prompt = `Generate ${count} unique insights about Artificial Intelligence. 
  Each insight should be either a 'merit' (advantage) or a 'demerit' (disadvantage/risk).
  Avoid these specific IDs if possible: ${existingIds.join(', ')}.
  Provide a diverse range of topics (ethics, economy, healthcare, creativity, etc.).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "A unique short slug for this insight" },
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["merit", "demerit"] },
            category: { type: Type.STRING, description: "e.g., Healthcare, Ethics, Productivity" },
            content: { type: Type.STRING, description: "Detailed explanation in 2-3 sentences" },
            impact_level: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
          },
          required: ["id", "title", "type", "category", "content", "impact_level"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}
