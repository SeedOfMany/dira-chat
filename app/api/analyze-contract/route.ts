import { embed } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { embeddingModel } from "@/lib/ai/providers";
import { searchSimilarLegalChunks } from "@/lib/db/legal";
import { extractText } from "@/lib/documents/process";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const query = formData.get("query") as string;

    if (!file && !query) {
      return NextResponse.json(
        { error: "Either file or query is required" },
        { status: 400 }
      );
    }

    let textToAnalyze = "";

    // If file is provided, extract text
    if (file) {
      const fileType = file.type === "application/pdf" ? "pdf" : "docx";
      const buffer = Buffer.from(await file.arrayBuffer());
      const { text } = await extractText(buffer, fileType);
      textToAnalyze = text;
    } else if (query) {
      textToAnalyze = query;
    }

    // Generate embedding for the contract/query
    const { embedding } = await embed({
      model: embeddingModel,
      value: textToAnalyze.substring(0, 2000), // Limit to first 2000 chars for embedding
    });

    // Search for similar legal chunks
    const relevantLegalChunks = await searchSimilarLegalChunks(embedding, 10);

    // Return relevant legal context
    return NextResponse.json({
      contractText: textToAnalyze,
      relevantRegulations: relevantLegalChunks.map((chunk) => ({
        content: chunk.content,
        similarity: chunk.similarity,
        metadata: chunk.metadata,
      })),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze contract" },
      { status: 500 }
    );
  }
}
