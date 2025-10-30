export const DEFAULT_CHAT_MODEL: string = "gemini-2.5-pro";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Google's reasoning model with Deep Think",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Google's advanced model with long context",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Google's fast and efficient model",
  },
];
