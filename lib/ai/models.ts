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
    description: "Google's most advanced reasoning model with thinking",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 2.0 Flash",
    description: "Fast and versatile multimodal model",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 2.0 Flash Exp",
    description: "Experimental fast model with latest features",
  },
];</parameter>
];
