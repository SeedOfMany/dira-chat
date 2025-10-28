import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  deleteLegalDocument,
  archiveLegalDocument,
  getLegalDocumentById,
} from "@/lib/db/legal";
import { del } from "@vercel/blob";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get document to delete from blob storage
    const document = await getLegalDocumentById(id);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete from blob storage
    try {
      await del(document.fileUrl);
    } catch (error) {
      console.error("Failed to delete from blob storage:", error);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await deleteLegalDocument(id);

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { archived } = await request.json();

    if (typeof archived !== "boolean") {
      return NextResponse.json(
        { error: "archived must be a boolean" },
        { status: 400 }
      );
    }

    await archiveLegalDocument(id, archived);

    return NextResponse.json({
      message: `Document ${archived ? "archived" : "unarchived"} successfully`,
    });
  } catch (error) {
    console.error("Archive error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}
