import { google } from "@ai-sdk/google";
import {
  createUIMessageStream,
  JsonToSseTransformStream,
  streamText,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { searchSimilarLegalChunks } from "@/lib/db/legal";
import { embeddingModel } from "@/lib/ai/providers";
import { embedMany } from "ai";
import type { TaskProgress } from "@/lib/types";

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().optional(),
      parts: z.array(z.any()).optional(),
    }),
  ),
  documentId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Add admin role check
  // if (session.user.role !== 'admin') {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const json = await request.json();
    const { messages, documentId } = RequestSchema.parse(json);

    // Get the latest user message
    const latestUserMessage = messages.filter((m) => m.role === "user").pop();

    if (!latestUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 },
      );
    }

    // Extract content from message (could be in content or parts)
    const messageContent =
      latestUserMessage.content ||
      (latestUserMessage.parts?.[0] &&
      typeof latestUserMessage.parts[0] === "object" &&
      "text" in latestUserMessage.parts[0]
        ? latestUserMessage.parts[0].text
        : "");

    if (!messageContent) {
      return NextResponse.json(
        { error: "Message content is empty" },
        { status: 400 },
      );
    }

    // Generate embedding for the user's question
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: [messageContent],
    });
    const queryEmbedding = embeddings[0];

    // Search for relevant chunks from the document
    const relevantChunks = await searchSimilarLegalChunks(
      queryEmbedding,
      10,
      documentId,
    );

    // Build context from relevant chunks
    const context = relevantChunks
      .map((chunk) => chunk.content)
      .join("\n\n---\n\n");

    // Create system prompt with context
    const systemPrompt = `You are a helpful AI assistant that answers questions about legal documents.

Use the following context from the document to answer the user's question. If the answer cannot be found in the context, say so.

DOCUMENT CONTEXT:
${context}

When answering:
- Be specific and reference relevant parts of the document
- If you're not certain, acknowledge the uncertainty
- Keep answers clear and concise
- Cite specific sections or terms when relevant

Before providing your answer, think step-by-step about:
1. What specific information is being requested
2. Which parts of the context are most relevant
3. How to structure a clear and accurate response

Then provide a concise answer based on the document context.`;

    // Stream response using Google Gemini
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const result = streamText({
          model: google("gemini-2.0-flash-exp"),
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content:
              m.content ||
              (m.parts?.[0] &&
              typeof m.parts[0] === "object" &&
              "text" in m.parts[0]
                ? m.parts[0].text
                : ""),
          })),
        });

        result.consumeStream();

        writer.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    console.error("Document chat error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
