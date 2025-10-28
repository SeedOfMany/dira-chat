import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createLegalDocument,
  storeLegalChunks,
  updateLegalDocumentStatus,
} from "@/lib/db/legal";
import { processDocument } from "@/lib/documents/process";

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: "File size should be less than 50MB",
    })
    .refine(
      (file) =>
        [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type),
      {
        message: "File type should be PDF or DOCX",
      }
    ),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Add admin role check here
  // if (session.user.role !== 'admin') {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get("file") as File).name;
    const fileType = file.type === "application/pdf" ? "pdf" : "docx";
    const fileBuffer = await file.arrayBuffer();

    // Use filename (without extension) as title
    const title = filename.replace(/\.(pdf|docx)$/i, "");

    // Upload to Vercel Blob
    const blob = await put(`legal-docs/${filename}`, fileBuffer, {
      access: "public",
    });

    // Create database record
    const doc = await createLegalDocument({
      title,
      fileName: filename,
      fileUrl: blob.url,
      fileType,
      category: undefined,
    });

    // Process document in background (extract text, chunk, embed)
    processDocumentBackground(doc.id, Buffer.from(fileBuffer), fileType);

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      status: doc.status,
      message: "Document uploaded successfully. Processing in background.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

/**
 * Process document in background
 * In production, use a job queue like BullMQ or Vercel Queue
 */
async function processDocumentBackground(
  documentId: string,
  buffer: Buffer,
  fileType: "pdf" | "docx"
) {
  try {
    // Process document
    const { chunks, embeddings, metadata } = await processDocument(
      buffer,
      fileType
    );

    // Store chunks with embeddings
    await storeLegalChunks(
      documentId,
      chunks.map((content, index) => ({
        content,
        embedding: embeddings[index],
        chunkIndex: index,
        metadata,
      }))
    );

    // Update status to ready
    await updateLegalDocumentStatus(documentId, "ready");

    console.log(`✅ Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`❌ Failed to process document ${documentId}:`, error);
    await updateLegalDocumentStatus(documentId, "failed");
  }
}
