import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getAllLegalDocuments,
  updateLegalDocumentStatus,
  storeLegalChunks,
  deleteLegalChunks,
} from "@/lib/db/legal";
import { processDocument } from "@/lib/documents/process";

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
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    console.log(`📄 Reprocessing request for document: ${documentId}`);

    // Get the document
    const documents = await getAllLegalDocuments();
    const document = documents.find((d) => d.id === documentId);

    if (!document) {
      console.error(`❌ Document not found: ${documentId}`);
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    console.log(`📄 Document found: ${document.title} (status: ${document.status})`);

    // Allow reprocessing for any status (including "ready")
    // This is useful for fixing documents or re-extracting with updated code

    // Delete existing chunks if any
    await deleteLegalChunks(documentId);
    console.log(`🗑️  Deleted existing chunks for: ${documentId}`);

    // Update status to processing
    await updateLegalDocumentStatus(documentId, "processing");
    console.log(`⏳ Status updated to processing for: ${documentId}`);

    // Fetch the file from blob storage
    const response = await fetch(document.fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from blob storage: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`📥 File fetched, size: ${buffer.length} bytes`);

    // Process document in background
    processDocumentBackground(
      documentId,
      buffer,
      document.fileType as "pdf" | "docx"
    );

    console.log(`✅ Reprocessing started for: ${documentId}`);

    return NextResponse.json({
      message: "Document reprocessing started",
      documentId,
    });
  } catch (error) {
    console.error("❌ Reprocess error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reprocess document" },
      { status: 500 }
    );
  }
}

/**
 * Process document in background
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

    console.log(`✅ Document ${documentId} reprocessed successfully`);
  } catch (error) {
    console.error(`❌ Failed to reprocess document ${documentId}:`, error);
    await updateLegalDocumentStatus(documentId, "failed");
  }
}
