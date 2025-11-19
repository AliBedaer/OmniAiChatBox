import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { AppSettings } from "../types";

// Initialize the client once
// NOTE: API KEY is strictly from process.env.API_KEY as per requirements.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createGeminiChat = (settings: AppSettings, history: any[] = []): Chat => {
  return ai.chats.create({
    model: settings.modelName,
    config: {
      systemInstruction: settings.systemInstruction,
      temperature: settings.temperature,
    },
    history: history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }))
  });
};

export const streamGeminiResponse = async (
  chat: Chat,
  message: string,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    const resultStream = await chat.sendMessageStream({ message });
    let fullText = "";
    
    for await (const chunk of resultStream) {
      const responseChunk = chunk as GenerateContentResponse;
      // Check if text exists to avoid undefined errors
      if (responseChunk.text) {
        const text = responseChunk.text;
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};