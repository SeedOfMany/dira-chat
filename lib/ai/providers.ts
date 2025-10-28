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
        "chat-model": anthropic("claude-3-5-haiku-20241022"),
        "chat-model-reasoning": anthropic("claude-3-5-haiku-20241022"),
        "title-model": anthropic("claude-3-5-haiku-20241022"),
        "artifact-model": anthropic("claude-3-5-haiku-20241022"),
      },
    });

// Google embedding model for vector search
export const embeddingModel = google.textEmbeddingModel("text-embedding-004");
