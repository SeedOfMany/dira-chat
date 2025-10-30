import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "gemini-2.5-pro": wrapLanguageModel({
          model: google("gemini-2.0-flash-thinking-exp-1219"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "gemini-1.5-pro": wrapLanguageModel({
          model: google("gemini-1.5-pro"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "gemini-1.5-flash": wrapLanguageModel({
          model: google("gemini-1.5-flash"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "title-model": google("gemini-1.5-flash"),
        "artifact-model": wrapLanguageModel({
          model: google("gemini-2.0-flash-thinking-exp-1219"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
      },
    });

// Google embedding model for vector search
export const embeddingModel = google.textEmbeddingModel("text-embedding-004");
