import { mutation } from "./_generated/server";

// Define the type for the file metadata
type FileMetadata = {
  storageId: string;
  author?: string; // Optional
  fileType: string;
  fileName: string;
  fileSize: number;
};

// Mutation to generate an upload URL
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Mutation to handle file metadata
export const sendFile = mutation(async (ctx, args: FileMetadata) => {
  const { storageId, author, fileType, fileName, fileSize } = args;

  if (!storageId || !fileType || !fileName || !fileSize) {
    throw new Error("Missing required file metadata.");
  }

  const timestamp = Date.now();

  // Insert the file metadata into the "messages" table
  await ctx.db.insert("messages", {
    storageId,
    author: author || "Anonymous",
    fileType,
    fileName,
    fileSize,
    timestamp,
  });
});
