"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LegalDocument = {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  category: string | null;
  status: string;
  archived: boolean;
  uploadedAt: string;
  chunkCount?: number;
};

export default function AdminDocumentChatPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [input, setInput] = useState("");

  const { messages, setMessages, sendMessage, status } = useChat({
    id: documentId,
    transport: new DefaultChatTransport({
      api: "/api/admin/document-chat",
      prepareSendMessagesRequest(request) {
        return {
          body: {
            id: request.id,
            messages: request.messages,
            documentId,
            ...request.body,
          },
        };
      },
    }),
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error(`Chat error: ${error.message}`);
    },
    onFinish: (message) => {
      console.log("Chat finished:", message);
    },
  });

  const isLoading = status === "in_progress";

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const response = await fetch("/api/admin/legal-docs");
      const data = await response.json();
      const doc = data.find((d: LegalDocument) => d.id === documentId);

      if (doc) {
        setDocument(doc);
      } else {
        toast.error("Document not found");
      }
    } catch (error) {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    setIsReprocessing(true);
    toast.loading("Starting reprocessing...", { id: "reprocess" });

    try {
      const response = await fetch("/api/admin/legal-docs/reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to reprocess document");
      }

      toast.success("Document reprocessing started", { id: "reprocess" });
      setDocument((prev) => (prev ? { ...prev, status: "processing" } : null));
      setIsReprocessing(false);

      // Poll for status updates
      const interval = setInterval(async () => {
        const resp = await fetch("/api/admin/legal-docs");
        const data = await resp.json();
        const doc = data.find((d: LegalDocument) => d.id === documentId);

        if (doc && doc.status !== "processing") {
          setDocument(doc);
          clearInterval(interval);

          if (doc.status === "ready") {
            toast.success("Document processed successfully!");
          } else if (doc.status === "failed") {
            toast.error("Document processing failed");
          }
        }
      }, 3000);

      // Clear interval after 5 minutes
      setTimeout(() => clearInterval(interval), 300000);
    } catch (error) {
      toast.error("Failed to start reprocessing", { id: "reprocess" });
      setIsReprocessing(false);
    }
  };

  const handleArchive = async () => {
    if (!document) return;

    try {
      const response = await fetch(`/api/admin/legal-docs/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !document.archived }),
      });

      if (!response.ok) {
        throw new Error("Failed to update document");
      }

      setDocument((prev) =>
        prev ? { ...prev, archived: !prev.archived } : null
      );
      toast.success(
        `Document ${!document.archived ? "archived" : "unarchived"} successfully`
      );
    } catch (error) {
      toast.error("Failed to update document");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/legal-docs/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document deleted successfully");
      router.push("/admin");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ready":
        return "default";
      case "processing":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Document not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Document Header */}
      <div className="border-b p-4">
        <div className="flex items-start gap-3">
          <FileIcon className="h-6 w-6 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-xl font-semibold">{document.title}</h1>
                <p className="text-sm text-muted-foreground">{document.fileName}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    ⋯
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleReprocess} disabled={isReprocessing}>
                    {isReprocessing ? "Reprocessing..." : "Reprocess"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive}>
                    {document.archived ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {document.category && (
                <Badge variant="secondary">{document.category}</Badge>
              )}
              <Badge variant={getStatusVariant(document.status)}>
                {document.status}
              </Badge>
              {document.archived && (
                <Badge variant="outline">Archived</Badge>
              )}
              {document.chunkCount !== undefined && document.chunkCount > 0 && (
                <Badge variant="outline">{document.chunkCount} chunks</Badge>
              )}
            </div>
          </div>
        </div>
        {document.status !== "ready" && (
          <div className="mt-4 p-3 bg-muted rounded-md text-sm">
            {document.status === "processing" && (
              <p>⏳ This document is still being processed. Chat functionality will be available once processing is complete.</p>
            )}
            {document.status === "failed" && (
              <div className="flex items-center justify-between">
                <p className="text-destructive">❌ Document processing failed. You can try reprocessing or re-upload the document.</p>
                <Button onClick={handleReprocess} variant="outline" size="sm">
                  Reprocess
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && document.status === "ready" && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Ask questions about this document</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              You can ask questions about the content, request summaries, or get specific information from the document.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="text-sm text-muted-foreground">Thinking...</div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || isLoading || document.status !== "ready") return;

            console.log("Sending message:", { input, documentId });
            sendMessage({ content: input, role: "user" });
            setInput("");
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              document.status === "ready"
                ? "Ask a question about this document..."
                : "Document must be ready to chat"
            }
            disabled={isLoading || document.status !== "ready"}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || document.status !== "ready" || !input?.trim()}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.title}"? This action
              cannot be undone. The document and all its chunks will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
