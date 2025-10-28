CREATE TABLE "LegalChunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768),
	"chunkIndex" text NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LegalDocument" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"fileName" text NOT NULL,
	"fileUrl" text NOT NULL,
	"fileType" varchar(10) NOT NULL,
	"category" text,
	"status" varchar(20) DEFAULT 'processing' NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL,
	"processedAt" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "UserContract" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid,
	"fileName" text NOT NULL,
	"fileUrl" text NOT NULL,
	"fileType" varchar(10) NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL,
	"analysisStatus" varchar(20) DEFAULT 'pending' NOT NULL,
	"analysisResult" jsonb
);
--> statement-breakpoint
ALTER TABLE "LegalChunk" ADD CONSTRAINT "LegalChunk_documentId_LegalDocument_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."LegalDocument"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserContract" ADD CONSTRAINT "UserContract_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserContract" ADD CONSTRAINT "UserContract_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "legal_chunk_embedding_idx" ON "LegalChunk" USING hnsw ("embedding" vector_cosine_ops);