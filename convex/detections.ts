import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Authentication required.");
  }

  return identity.subject;
}

export const create = mutation({
  args: {
    mediaId: v.id("media"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const image = await ctx.db.get(args.mediaId);

    if (!image) {
      throw new Error("Image not found.");
    }

    if (image.ownerId !== userId) {
      throw new Error("You can only create detections for your own images.");
    }

    const now = Date.now();

    return await ctx.db.insert("detections", {
      mediaId: image._id,
      storageId: image.storageId,
      ownerId: userId,
      createdBy: userId,
      imageName: image.name,
      imageSize: image.size,
      imageContentType: image.contentType,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
    });
  },
});

export const get = query({
  args: {
    detectionId: v.string(),
  },
  handler: async (ctx, args) => {
    const detectionId = ctx.db.normalizeId("detections", args.detectionId);

    if (!detectionId) {
      return null;
    }

    const detection = await ctx.db.get(detectionId);

    if (!detection) {
      return null;
    }

    return {
      ...detection,
      image: {
        storageId: detection.storageId,
        name: detection.imageName,
        size: detection.imageSize,
        contentType: detection.imageContentType,
        url: await ctx.storage.getUrl(detection.storageId),
      },
    };
  },
});

export const updateImage = mutation({
  args: {
    detectionId: v.id("detections"),
    mediaId: v.id("media"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const detection = await ctx.db.get(args.detectionId);

    if (!detection) {
      throw new Error("Detection not found.");
    }

    if (detection.ownerId !== userId) {
      throw new Error("Only the owner can edit this detection.");
    }

    const image = await ctx.db.get(args.mediaId);

    if (!image) {
      throw new Error("Image not found.");
    }

    if (image.ownerId !== userId) {
      throw new Error("You can only attach your own images.");
    }

    await ctx.db.patch(args.detectionId, {
      mediaId: image._id,
      storageId: image.storageId,
      imageName: image.name,
      imageSize: image.size,
      imageContentType: image.contentType,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    return args.detectionId;
  },
});
