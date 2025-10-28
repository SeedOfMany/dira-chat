import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  deleteLegalDocument,
  getAllLegalDocuments,
} from "@/lib/db/legal";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Add admin role check
  // if (session.user.role !== 'admin') {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const documents = await getAllLegalDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Add admin role check
  // if (session.user.role !== 'admin') {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    await deleteLegalDocument(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
