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
import { Response } from "@/components/ai-elements/response";
import { Actions, Action } from "@/components/ai-elements/actions";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton
} from "@/components/ai-elements/conversation";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Copy, RefreshCw, Search, FileText, Lightbulb } from "lucide-react";

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

  const isLoading = status === "streaming";

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleRegenerateMessage = (messageId: string) => {
    // Find the message index
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Remove all messages from this point forward
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);

    // Get the last user message to regenerate
    const lastUserMessage = newMessages[newMessages.length - 1];
    if (lastUserMessage && lastUserMessage.role === "user") {
      sendMessage({ parts: lastUserMessage.parts, role: "user" });
    }
  };

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
          <div className="mt-1 flex-shrink-0">
            <FileIcon size={24} />
          </div>
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
      <Conversation>
        <ConversationScrollButton />
        <ConversationContent>
          {messages.length === 0 && document.status === "ready" ? (
            <ConversationEmptyState
              icon={<FileIcon size={48} />}
              title="Ask questions about this document"
              description="You can ask questions about the content, request summaries, or get specific information from the document."
            />
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col gap-2 ${message.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className={`max-w-[80%] ${message.role === "user" ? "" : "w-full"}`}>
                    {message.role === "assistant" ? (
                      <div className="space-y-3">
                        {/* Chain of Thought - Show reasoning steps */}
                        {(() => {
                          const reasoningParts = message.parts.filter((part: any) => part.type === "reasoning");
                          return reasoningParts.length > 0 && (
                            <ChainOfThought defaultOpen={false}>
                              <ChainOfThoughtHeader>
                                Thinking Process
                              </ChainOfThoughtHeader>
                              <ChainOfThoughtContent>
                                {reasoningParts.map((part: any, idx: number) => (
                                  <ChainOfThoughtStep
                                    key={idx}
                                    icon={idx === 0 ? Search : idx === 1 ? FileText : Lightbulb}
                                    label={part.text}
                                    status="complete"
                                  />
                                ))}
                              </ChainOfThoughtContent>
                            </ChainOfThought>
                          );
                        })()}

                        {/* Response */}
                        <div className="rounded-lg px-4 py-2 bg-muted">
                          <Response className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            {message.parts.filter((part: any) => part.type === "text").map((part: any) => part.text).join("")}
                          </Response>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg px-4 py-2 bg-primary text-primary-foreground">
                        <div className="text-sm whitespace-pre-wrap">
                          {message.parts.filter((part: any) => part.type === "text").map((part: any) => part.text).join("")}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.role === "assistant" && (
                    <Actions>
                      <Action
                        tooltip="Copy"
                        onClick={() => handleCopyMessage(message.parts.filter((part: any) => part.type === "text").map((part: any) => part.text).join(""))}
                      >
                        <Copy className="size-4" />
                      </Action>
                      <Action
                        tooltip="Regenerate"
                        onClick={() => handleRegenerateMessage(message.id)}
                        disabled={isLoading}
                      >
                        <RefreshCw className="size-4" />
                      </Action>
                    </Actions>
                  )}
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
          )}
        </ConversationContent>
      </Conversation>

      {/* Chat Input */}
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || isLoading || document.status !== "ready") return;

            console.log("Sending message:", { input, documentId });
            sendMessage({ parts: [{ type: "text", text: input }], role: "user" });
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
