import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define the schema
export default defineSchema({
  messages: defineTable({
    storageId: v.string(),          // Required: Storage ID for the uploaded file
    author: v.optional(v.string()), // Optional: Name of the uploader
    fileType: v.optional(v.string()), // Optional: File type (e.g., "image", "document")
    fileName: v.optional(v.string()), // Optional: File name
    fileSize: v.optional(v.number()), // Optional: File size in bytes
    timestamp: v.number(),          // Required: Timestamp of the upload
  }),
});
