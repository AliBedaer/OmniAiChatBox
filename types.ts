export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export enum ModelProvider {
  GEMINI = 'Gemini',
  OPENAI = 'OpenAI', // Placeholder for UI
  CLAUDE = 'Claude'  // Placeholder for UI
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  provider: ModelProvider;
  modelName: string;
  systemInstruction: string;
  temperature: number;
  userName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: ModelProvider.GEMINI,
  modelName: 'gemini-2.5-flash',
  systemInstruction: 'You are a helpful, intelligent assistant.',
  temperature: 0.7,
  userName: 'User'
};