import { tool, jsonSchema, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { documentHandlersByArtifactKind } from "@/lib/artifacts/server";
import { getDocumentById } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";

type UpdateDocumentProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const updateDocument = ({ session, dataStream }: UpdateDocumentProps) =>
  tool({
    description: "Update a document with the given description.",
    inputSchema: jsonSchema<{ id: string; description: string }>({
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The ID of the document to update"
        },
        description: {
          type: "string",
          description: "The description of changes that need to be made"
        }
      },
      required: ["id", "description"]
    }),
    execute: async ({ id, description }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: "Document not found",
        };
      }

      dataStream.write({
        type: "data-clear",
        data: null,
        transient: true,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === document.kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }

      await documentHandler.onUpdateDocument({
        document,
        description,
        dataStream,
        session,
      });

      dataStream.write({ type: "data-finish", data: null, transient: true });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: "The document has been updated successfully.",
      };
    },
  });
