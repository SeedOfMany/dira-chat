import "server-only";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedMany } from "ai";
import mammoth from "mammoth";
import { embeddingModel } from "../ai/providers";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

/**
 * Extract text from PDF using OCR (Google Cloud Vision)
 * Used as fallback when pdf-parse extracts little/no text
 *
 * Processes all pages by rendering each as an image
 */
async function extractTextWithOCR(buffer: Buffer): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      console.warn("⚠️  OCR not configured. Set GOOGLE_GENERATIVE_AI_API_KEY");
      return "";
    }

    // Load PDF to get page count
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();

    console.log(`🔍 Running OCR on PDF (${pageCount} pages)...`);

    // Limit to 50 pages to avoid excessive costs and time
    const maxPages = Math.min(pageCount, 50);

    let allText = "";

    // Process 5 pages at a time using the files:annotate endpoint
    for (let batchStart = 1; batchStart <= maxPages; batchStart += 5) {
      const batchEnd = Math.min(batchStart + 4, maxPages);
      const batchPages = [];

      for (let p = batchStart; p <= batchEnd; p++) {
        batchPages.push(p);
      }

      console.log(`📄 Processing pages ${batchStart}-${batchEnd}...`);

      // Call Vision API with PDF for this batch of 5 pages
      const base64Pdf = buffer.toString('base64');

      const response = await fetch(
        `https://vision.googleapis.com/v1/files:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              inputConfig: {
                content: base64Pdf,
                mimeType: 'application/pdf'
              },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
              pages: batchPages
            }]
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`OCR API error on pages ${batchStart}-${batchEnd}: ${response.status} - ${error}`);
        continue;
      }

      const data = await response.json();
      const outerResponses = data.responses || [];

      if (outerResponses.length === 0 || !outerResponses[0].responses) {
        console.warn(`⚠️  No responses for pages ${batchStart}-${batchEnd}`);
        continue;
      }

      const pageResponses = outerResponses[0].responses || [];

      for (let i = 0; i < pageResponses.length; i++) {
        const pageResponse = pageResponses[i];
        const actualPageNum = batchStart + i;

        if (pageResponse.error) {
          console.error(`❌ OCR error on page ${actualPageNum}:`, pageResponse.error);
          continue;
        }

        const pageText = pageResponse.fullTextAnnotation?.text || "";
        if (pageText) {
          allText += pageText + "\n\n";
          console.log(`✅ Page ${actualPageNum}: extracted ${pageText.length} characters`);
        } else {
          console.warn(`⚠️  Page ${actualPageNum}: no text found`);
        }
      }
    }

    console.log(`🔍 OCR total extracted ${allText.length} characters from ${maxPages} pages`);
    return allText.trim();
  } catch (error) {
    console.error("OCR error:", error);
    return "";
  }
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  // Use dynamic import for pdf-parse since it's CommonJS
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);

  let finalText = data.text;

  // If very little text extracted (likely image-based PDF), try OCR
  if (finalText.length < 100) {
    console.log(`⚠️  Only ${finalText.length} characters extracted, trying OCR...`);
    const ocrText = await extractTextWithOCR(buffer);

    if (ocrText.length > finalText.length) {
      console.log(`✅ OCR found more text (${ocrText.length} vs ${finalText.length} characters)`);
      finalText = ocrText;
    }
  }

  return {
    text: finalText,
    pageCount: data.numpages,
  };
}

/**
 * Extract text from DOCX file
 */
export async function extractTextFromDOCX(
  buffer: Buffer
): Promise<{ text: string }> {
  const result = await mammoth.extractRawText({ buffer });
  return {
    text: result.value,
  };
}

/**
 * Extract text based on file type
 */
export async function extractText(
  buffer: Buffer,
  fileType: "pdf" | "docx"
): Promise<{ text: string; metadata?: any }> {
  if (fileType === "pdf") {
    const { text, pageCount } = await extractTextFromPDF(buffer);
    return { text, metadata: { pageCount } };
  }

  if (fileType === "docx") {
    const { text } = await extractTextFromDOCX(buffer);
    return { text };
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

/**
 * Split text into chunks for embedding
 */
export async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // Characters per chunk
    chunkOverlap: 200, // Overlap between chunks for context
    separators: ["\n\n", "\n", ". ", " ", ""], // Split on paragraphs, sentences, etc.
  });

  const chunks = await splitter.splitText(text);
  return chunks;
}

/**
 * Generate embeddings for text chunks using Google's embedding model
 * Batches requests to respect Google's 100 request per batch limit
 */
export async function generateEmbeddings(
  chunks: string[]
): Promise<number[][]> {
  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];

  // Process chunks in batches of 100
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    console.log(
      `Generating embeddings for batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (${batch.length} chunks)`
    );

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch,
    });

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/**
 * Process a document: extract text, chunk, and generate embeddings
 */
export async function processDocument(
  buffer: Buffer,
  fileType: "pdf" | "docx"
): Promise<{
  chunks: string[];
  embeddings: number[][];
  metadata: any;
}> {
  // Extract text
  const { text, metadata } = await extractText(buffer, fileType);
  console.log(`📄 Extracted ${text.length} characters from ${fileType}`);

  if (text.length === 0) {
    console.warn(`⚠️  Warning: No text extracted from document. This may be an image-based PDF or corrupted file.`);
    return {
      chunks: [],
      embeddings: [],
      metadata,
    };
  }

  // Chunk text
  const chunks = await chunkText(text);
  console.log(`✂️  Split into ${chunks.length} chunks`);

  if (chunks.length === 0) {
    console.warn(`⚠️  Warning: Text was extracted but no chunks created. Text may be too short.`);
    return {
      chunks: [],
      embeddings: [],
      metadata,
    };
  }

  // Generate embeddings
  const embeddings = await generateEmbeddings(chunks);

  return {
    chunks,
    embeddings,
    metadata,
  };
}
