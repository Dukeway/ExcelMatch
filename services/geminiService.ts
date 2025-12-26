import { GoogleGenAI, Type } from "@google/genai";

export const suggestMatchColumns = async (
  leftFileName: string,
  leftHeaders: string[],
  rightFileName: string,
  rightHeaders: string[]
): Promise<{ leftKey: string; rightKey: string; reasoning: string } | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API KEY found for Gemini suggestions");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      I have two Excel files that need to be joined (VLOOKUP style).
      
      File 1 (Left Table): "${leftFileName}"
      Headers: ${JSON.stringify(leftHeaders)}
      
      File 2 (Right Table/Lookup): "${rightFileName}"
      Headers: ${JSON.stringify(rightHeaders)}
      
      Identify the most likely "Key" column from both files that refers to the same entity (e.g., ID, Email, SKU, Name) to use for joining.
      Return the exact header name for both.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            leftKey: { type: Type.STRING, description: "The exact header name from File 1 to use as key" },
            rightKey: { type: Type.STRING, description: "The exact header name from File 2 to use as key" },
            reasoning: { type: Type.STRING, description: "Short explanation of why these columns match" }
          },
          required: ["leftKey", "rightKey", "reasoning"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini suggestion failed:", error);
    return null;
  }
};