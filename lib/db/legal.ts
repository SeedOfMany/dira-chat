import "server-only";

import { cosineDistance, count, desc, eq, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { legalChunk, legalDocument } from "./schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Create a legal document record
 */
export async function createLegalDocument(data: {
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: "pdf" | "docx";
  category?: string;
  metadata?: any;
}) {
  const [doc] = await db
    .insert(legalDocument)
    .values({
      ...data,
      status: "processing",
    })
    .returning();

  return doc;
}

/**
 * Update legal document status
 */
export async function updateLegalDocumentStatus(
  id: string,
  status: "processing" | "ready" | "failed"
) {
  await db
    .update(legalDocument)
    .set({
      status,
      processedAt: status === "ready" ? new Date() : null,
    })
    .where(eq(legalDocument.id, id));
}

/**
 * Store chunks with embeddings for a legal document
 */
export async function storeLegalChunks(
  documentId: string,
  chunks: Array<{
    content: string;
    embedding: number[];
    chunkIndex: number;
    metadata?: any;
  }>
) {
  // Skip if no chunks to store
  if (chunks.length === 0) {
    console.log(`⚠️  No chunks to store for document ${documentId}`);
    return;
  }

  await db.insert(legalChunk).values(
    chunks.map((chunk) => ({
      documentId,
      content: chunk.content,
      embedding: chunk.embedding,
      chunkIndex: chunk.chunkIndex.toString(),
      metadata: chunk.metadata,
    }))
  );
}

/**
 * Vector similarity search to find relevant legal text
 */
export async function searchSimilarLegalChunks(
  queryEmbedding: number[],
  limit = 10,
  documentId?: string
) {
  const similarity = sql<number>`1 - (${cosineDistance(legalChunk.embedding, queryEmbedding)})`;

  let query = db
    .select({
      id: legalChunk.id,
      content: legalChunk.content,
      chunkIndex: legalChunk.chunkIndex,
      metadata: legalChunk.metadata,
      documentId: legalChunk.documentId,
      similarity,
    })
    .from(legalChunk);

  // If documentId is provided, filter by that document
  if (documentId) {
    query = query.where(eq(legalChunk.documentId, documentId)) as any;
  }

  const results = await query
    .orderBy(desc(similarity))
    .limit(limit);

  return results;
}

/**
 * Get all legal documents with chunk counts
 */
export async function getAllLegalDocuments() {
  const documents = await db
    .select()
    .from(legalDocument)
    .orderBy(desc(legalDocument.uploadedAt));

  // Get chunk counts for each document
  const documentsWithCounts = await Promise.all(
    documents.map(async (doc) => {
      const [result] = await db
        .select({ count: count() })
        .from(legalChunk)
        .where(eq(legalChunk.documentId, doc.id));

      return {
        ...doc,
        chunkCount: result?.count || 0,
      };
    })
  );

  return documentsWithCounts;
}

/**
 * Get legal document by ID
 */
export async function getLegalDocumentById(id: string) {
  const [doc] = await db
    .select()
    .from(legalDocument)
    .where(eq(legalDocument.id, id));

  return doc;
}

/**
 * Delete legal document and its chunks
 */
export async function deleteLegalDocument(id: string) {
  // Chunks will be deleted automatically due to cascade
  await db.delete(legalDocument).where(eq(legalDocument.id, id));
}

/**
 * Archive/unarchive legal document
 */
export async function archiveLegalDocument(id: string, archived: boolean) {
  await db
    .update(legalDocument)
    .set({ archived })
    .where(eq(legalDocument.id, id));
}

/**
 * Get chunk count for a document
 */
export async function getDocumentChunkCount(documentId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(legalChunk)
    .where(eq(legalChunk.documentId, documentId));

  return result?.count || 0;
}

/**
 * Delete all chunks for a document
 */
export async function deleteLegalChunks(documentId: string) {
  await db.delete(legalChunk).where(eq(legalChunk.documentId, documentId));
}
