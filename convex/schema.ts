import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  media: defineTable({
    storageId: v.id("_storage"),
    ownerId: v.string(),
    name: v.string(),
    size: v.number(),
    contentType: v.string(),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),
  detections: defineTable({
    mediaId: v.id("media"),
    storageId: v.id("_storage"),
    ownerId: v.string(),
    createdBy: v.string(),
    imageName: v.string(),
    imageSize: v.number(),
    imageContentType: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_media", ["mediaId"]),
});
