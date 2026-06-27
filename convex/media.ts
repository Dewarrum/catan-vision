import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Authentication required.");
  }

  return identity.subject;
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

export const saveImage = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);

    return await ctx.db.insert("media", {
      ...args,
      ownerId,
      createdAt: Date.now(),
    });
  },
});

export const listMyImages = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx);
    const images = await ctx.db
      .query("media")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .collect();

    return await Promise.all(
      images.map(async (image) => ({
        ...image,
        url: await ctx.storage.getUrl(image.storageId),
      })),
    );
  },
});
