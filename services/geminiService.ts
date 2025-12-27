import { GoogleGenAI, Type } from "@google/genai";
import { VisionState } from '../types';

// Initialize Gemini
// NOTE: API Key must be provided in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview'; // Fast model for near real-time vision

const SYSTEM_INSTRUCTION = `
You are the "Eye of the Ocean" game engine. 
Analyze the image of the player. 
You must output valid JSON only.
Detections:
1. isPresent: true if a human face/body is clearly visible.
2. expression: 'smile' (calm), 'frown' (anger/concentration), 'surprise' (shock), or 'neutral'.
3. gesture: 
   - 'open_palm' (hand raised, open palm facing camera)
   - 'circle' (two hands forming a shape or one hand making C/O shape)
   - 'point' (index finger pointing)
   - 'none' (no specific gesture)
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isPresent: { type: Type.BOOLEAN },
    expression: { type: Type.STRING, enum: ['neutral', 'smile', 'frown', 'surprise'] },
    gesture: { type: Type.STRING, enum: ['none', 'open_palm', 'circle', 'point'] }
  },
  required: ['isPresent', 'expression', 'gesture']
};

export const analyzeFrame = async (base64Image: string): Promise<VisionState> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found. Returning mock data.");
    return { isPresent: true, expression: 'neutral', gesture: 'none', lastUpdated: Date.now() };
  }

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: "Analyze the player's state." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const data = JSON.parse(text);

    return {
      isPresent: data.isPresent,
      expression: data.expression,
      gesture: data.gesture,
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    // Return a safe fallback to prevent game crash
    return { isPresent: true, expression: 'neutral', gesture: 'none', lastUpdated: Date.now() };
  }
};