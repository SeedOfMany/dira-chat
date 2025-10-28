import { anthropic } from "@ai-sdk/anthropic";
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
        "chat-model": wrapLanguageModel({
          model: anthropic("claude-3-7-sonnet-20250219"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "chat-model-reasoning": wrapLanguageModel({
          model: anthropic("claude-3-7-sonnet-20250219"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "gemini-2.5-pro": wrapLanguageModel({
          model: google("gemini-2.5-pro-exp-03-25"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "title-model": anthropic("claude-3-5-haiku-20241022"),
        "artifact-model": wrapLanguageModel({
          model: anthropic("claude-3-7-sonnet-20250219"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
      },
    });

// Google embedding model for vector search
export const embeddingModel = google.textEmbeddingModel("text-embedding-004");
