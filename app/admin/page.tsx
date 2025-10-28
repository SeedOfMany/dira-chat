"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircleFillIcon, LoaderIcon } from "@/components/icons";

type UploadingFile = {
  name: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

export default function AdminPage() {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/legal-docs");
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Filter by supported file types (for folder uploads)
    const supportedFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext === 'pdf' || ext === 'docx';
    });

    // Filter out duplicates based on existing documents
    const existingNames = new Set(documents.map(d => d.fileName));
    const newFiles = supportedFiles.filter(file => !existingNames.has(file.name));

    const unsupportedCount = files.length - supportedFiles.length;
    const skippedCount = supportedFiles.length - newFiles.length;

    if (unsupportedCount > 0) {
      toast.info(`Skipped ${unsupportedCount} unsupported file(s)`);
    }
    if (skippedCount > 0) {
      toast.info(`Skipped ${skippedCount} duplicate file(s)`);
    }

    setSelectedFiles(newFiles);
    setUploadingFiles(
      newFiles.map((file) => ({
        name: file.name,
        status: "pending",
        progress: 0,
      }))
    );
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setUploading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Update status to uploading
      setUploadingFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading", progress: 0 } : f
        )
      );

      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        // Simulate progress (since fetch doesn't support upload progress natively)
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === i && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          );
        }, 200);

        const response = await fetch("/api/admin/legal-docs/upload", {
          method: "POST",
          body: uploadFormData,
        });

        clearInterval(progressInterval);

        if (response.ok) {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "success", progress: 100 } : f
            )
          );
        } else {
          const data = await response.json();
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                    error: data.error || "Upload failed",
                  }
                : f
            )
          );
        }
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error: "Network error",
                }
              : f
          )
        );
      }
    }

    const successCount = uploadingFiles.filter(
      (f) => f.status === "success"
    ).length;
    const failCount = uploadingFiles.filter((f) => f.status === "error").length;

    if (successCount > 0) {
      toast.success(`${successCount} document(s) uploaded successfully!`);
      loadDocuments();
    }

    if (failCount > 0) {
      toast.error(`${failCount} document(s) failed to upload`);
    }

    setUploading(false);

    // Clear after 3 seconds
    setTimeout(() => {
      setSelectedFiles([]);
      setUploadingFiles([]);
      const form = document.querySelector("form");
      form?.reset();
    }, 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/admin/legal-docs?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Document deleted");
        loadDocuments();
      } else {
        toast.error("Failed to delete document");
      }
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

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Legal Documents Admin
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload and manage legal documents for contract analysis
            </p>
          </div>

          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Legal Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="files">Documents (PDF or DOCX)</Label>
                  <Input
                    id="files"
                    name="files"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading}
                    // @ts-ignore - webkitdirectory is not in React types but works
                    webkitdirectory=""
                    directory=""
                  />
                  <p className="text-xs text-muted-foreground">
                    Select a folder or multiple files. Duplicates will be automatically skipped.
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Selected Files ({selectedFiles.length})
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto rounded-md border p-3">
                      {uploadingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-sm"
                        >
                          <div className="flex-shrink-0">
                            {file.status === "success" && (
                              <CheckCircleFillIcon
                                size={16}
                                className="text-green-500"
                              />
                            )}
                            {file.status === "uploading" && (
                              <LoaderIcon
                                size={16}
                                className="animate-spin text-blue-500"
                              />
                            )}
                            {file.status === "error" && (
                              <div className="h-4 w-4 rounded-full bg-red-500" />
                            )}
                            {file.status === "pending" && (
                              <div className="h-4 w-4 rounded-full bg-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">
                              {file.name}
                            </div>
                            {file.status === "uploading" && (
                              <Progress value={file.progress} className="h-1 mt-1" />
                            )}
                            {file.status === "error" && file.error && (
                              <div className="text-xs text-red-500 mt-1">
                                {file.error}
                              </div>
                            )}
                            {file.status === "success" && (
                              <div className="text-xs text-green-600 mt-1">
                                Uploaded successfully
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={uploading || selectedFiles.length === 0}>
                  {uploading
                    ? `Uploading ${uploadingFiles.filter((f) => f.status === "uploading").length}/${selectedFiles.length}...`
                    : "Upload Documents"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Uploaded Documents ({documents.length})</CardTitle>
              <Button variant="outline" onClick={loadDocuments} size="sm" disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No documents uploaded yet. Upload your first legal document
                    above.
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold leading-none">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.fileName} • {doc.fileType.toUpperCase()}
                        </p>
                        <div className="flex gap-2 pt-2">
                          {doc.category && (
                            <Badge variant="secondary">{doc.category}</Badge>
                          )}
                          <Badge variant={getStatusVariant(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
