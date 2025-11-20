import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisReport } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// System instruction for the specialized financial analysis
const ANALYST_SYSTEM_INSTRUCTION = `
You are an expert forensic accountant and legal analyst specializing in California divorce cases. 
Your goal is to analyze financial data (bank statements, crypto transactions, spreadsheets) to determine the "Marital Standard of Living" (MSOL) as defined by California Family Code Section 4320.
You must identify discrepancies between parties, hidden assets, or lifestyle inflation/deflation post-separation.
Always be objective, precise, and cite relevant generic legal principles (e.g., "status quo").
Output JSON for data visualization when requested.
`;

export const analyzeFinancialDocuments = async (
  textData: string, 
  imageParts: { mimeType: string; data: string }[]
): Promise<AnalysisReport> => {
  
  const prompt = `
    Analyze the provided financial documents and data.
    
    1. Extract spending categories and sum them up for Party A and Party B.
    2. specificially look for "Dissipation of Assets" or unusual crypto transfers.
    3. Assess the Standard of Living based on this spending.
    4. Provide a comparison suitable for a chart.

    Return the response in this JSON schema:
    {
      "summary": "Executive summary of findings...",
      "standardOfLivingAssessment": "Detailed assessment of MSOL...",
      "californiaCodeReferences": ["Section 4320(a)", "Section 2600", ...],
      "chartData": [
        { "category": "Housing", "partyAAmount": 5000, "partyBAmount": 2000, "discrepancy": 3000, "notes": "Party A retained marital home" }
      ],
      "lifestyleMetaphorPrompt": "A visual description representing the disparity, e.g., 'A balanced scale vs a broken scale...'"
    }
  `;

  const contents = [];
  if (textData) contents.push({ text: textData });
  imageParts.forEach(part => {
    contents.push({ inlineData: part });
  });
  contents.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: contents as any }, // API type flexibility
      config: {
        systemInstruction: ANALYST_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                standardOfLivingAssessment: { type: Type.STRING },
                californiaCodeReferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                lifestyleMetaphorPrompt: { type: Type.STRING },
                chartData: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            partyAAmount: { type: Type.NUMBER },
                            partyBAmount: { type: Type.NUMBER },
                            discrepancy: { type: Type.NUMBER },
                            notes: { type: Type.STRING }
                        }
                    }
                }
            }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    return JSON.parse(jsonText) as AnalysisReport;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const generateChatResponse = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: history,
        config: {
            systemInstruction: ANALYST_SYSTEM_INSTRUCTION
        }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
};

export const generateVisualMetaphor = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `Photorealistic, professional, cinematic lighting. A metaphorical representation of: ${prompt}. High quality, 8k.`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (e) {
        console.error("Image Gen Error", e);
        return "";
    }
}

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, authoritative voice for legal context
              },
          },
        },
      });
      
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export const getLiveClient = () => {
    return ai.live;
}