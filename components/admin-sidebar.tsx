"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useState } from "react";
import { FileIcon, PlusIcon } from "@/components/icons";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

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

export function AdminSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch("/api/admin/legal-docs");
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
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

  const reprocessAllFailed = async () => {
    const failedDocs = documents.filter((doc) => doc.status === "failed");

    if (failedDocs.length === 0) {
      toast.info("No failed documents to reprocess");
      return;
    }

    toast.info(`Reprocessing ${failedDocs.length} failed document(s)...`);

    let successCount = 0;
    let failCount = 0;

    for (const doc of failedDocs) {
      try {
        const response = await fetch("/api/admin/legal-docs/reprocess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: doc.id }),
        });

        if (response.ok) {
          successCount++;
        } else {
          const error = await response.json();
          console.error(`Failed to reprocess ${doc.title}:`, error);
          failCount++;
          toast.error(`Failed to reprocess ${doc.title}: ${error.error}`);
        }
      } catch (error) {
        console.error(`Failed to reprocess document ${doc.id}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Reprocessing started for ${successCount} document(s)`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} document(s) failed to start reprocessing`);
    }

    setTimeout(() => loadDocuments(), 2000);
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between">
            <Link
              className="flex flex-row items-center gap-3"
              href="/admin"
              onClick={() => {
                setOpenMobile(false);
              }}
            >
              <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                Admin Portal
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-8 p-1 md:h-fit md:p-2"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push("/admin");
                  }}
                  type="button"
                  variant="ghost"
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end" className="hidden md:block">
                Upload Document
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-2 px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-muted-foreground">
              Legal Documents ({documents.length})
            </div>
            {documents.some((doc) => doc.status === "failed") && (
              <Button
                onClick={reprocessAllFailed}
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
              >
                Reprocess Failed
              </Button>
            )}
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No documents yet
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/admin/chat/${doc.id}`}
                  onClick={() => setOpenMobile(false)}
                  className="flex flex-col gap-1 rounded-md p-2 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <FileIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {doc.title}
                        {doc.archived && (
                          <span className="ml-1 text-xs text-muted-foreground">(archived)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {doc.fileName}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {doc.category && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {doc.category}
                          </Badge>
                        )}
                        <Badge
                          variant={getStatusVariant(doc.status)}
                          className="text-xs px-1 py-0"
                        >
                          {doc.status}
                        </Badge>
                        {doc.chunkCount !== undefined && doc.chunkCount > 0 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {doc.chunkCount} chunks
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
