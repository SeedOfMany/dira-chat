import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  lastContext: jsonb("lastContext").$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

// Legal documents uploaded by admin (laws, regulations, etc.)
export const legalDocument = pgTable("LegalDocument", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: text("title").notNull(),
  fileName: text("fileName").notNull(),
  fileUrl: text("fileUrl").notNull(), // Vercel Blob URL
  fileType: varchar("fileType", { length: 10 }).notNull(), // 'pdf' or 'docx'
  category: text("category"), // e.g., 'labor_law', 'tax_regulation'
  status: varchar("status", { length: 20 }).notNull().default("processing"), // 'processing', 'ready', 'failed'
  uploadedAt: timestamp("uploadedAt").notNull().defaultNow(),
  processedAt: timestamp("processedAt"),
  metadata: jsonb("metadata"), // Additional metadata like page count, author, etc.
});

export type LegalDocument = InferSelectModel<typeof legalDocument>;

// Chunks from legal documents with embeddings for RAG
export const legalChunk = pgTable(
  "LegalChunk",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    documentId: uuid("documentId")
      .notNull()
      .references(() => legalDocument.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }), // Google text-embedding-004 is 768 dimensions
    chunkIndex: text("chunkIndex").notNull(), // Position in document
    metadata: jsonb("metadata"), // Page number, section title, etc.
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    embeddingIndex: index("legal_chunk_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

export type LegalChunk = InferSelectModel<typeof legalChunk>;

// User contracts uploaded for analysis
export const userContract = pgTable("UserContract", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  chatId: uuid("chatId").references(() => chat.id),
  fileName: text("fileName").notNull(),
  fileUrl: text("fileUrl").notNull(), // Vercel Blob URL
  fileType: varchar("fileType", { length: 10 }).notNull(),
  uploadedAt: timestamp("uploadedAt").notNull().defaultNow(),
  analysisStatus: varchar("analysisStatus", { length: 20 })
    .notNull()
    .default("pending"),
  analysisResult: jsonb("analysisResult"), // Store AI analysis results
});

export type UserContract = InferSelectModel<typeof userContract>;
