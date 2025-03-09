import { v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { useQuery } from "convex/react";
import { Id } from "./_generated/dataModel";

export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!currentUser) throw new Error("User not found");
  return currentUser;
}

export const create = mutation({
  args: {
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    image: v.string(),
    clerkId: v.string(),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (existingUser) return;
    await ctx.db.insert("users", {
      ...args,
      followers: 0,
      followings: 0,
      posts: 0,
    });
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
    return user;
  },
});

export const update = mutation({
  args: {
    username: v.string(),
    fullname: v.string(),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await getAuthenticatedUser(ctx);
    if (!existingUser) throw new Error("User not found");
    if (existingUser.username !== args.username) {
      const existingUsername = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();
      if (existingUsername) throw new Error("Username is not unique");
    }
    await ctx.db.patch(existingUser._id, {
      ...args,
    });
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    if (!user) return null;
    return user;
  },
});

export const isFollowing = query({
  args: { followingId: v.id("users") },
  handler: async (ctx, { followingId }) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", followingId)
      )
      .first();
    return !!follow;
  },
});

export const toggleFollow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, { followingId }) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", followingId)
      )
      .first();

    if (existing) {
      // unfollow
      await ctx.db.delete(existing._id);
      await updateFollowCount(ctx, currentUser._id, followingId, false);
    } else {
      // follow
      await ctx.db.insert("follows", {
        followerId: currentUser._id,
        followingId,
      });
      await updateFollowCount(ctx, currentUser._id, followingId, true);
      await ctx.db.insert("notifications", {
        receiverId: followingId,
        senderId: currentUser._id,
        type: "follow",
      });
    }
  },
});

const updateFollowCount = async (
  ctx: MutationCtx,
  followerId: Id<"users">,
  followingId: Id<"users">,
  isFollow: boolean
) => {
  const follower = await ctx.db.get(followerId);
  const following = await ctx.db.get(followingId);

  if (follower && following) {
    await ctx.db.patch(followerId, {
      followings: follower.followings + (isFollow ? 1 : -1),
    });
    await ctx.db.patch(followingId, {
      followers: following.followers + (isFollow ? 1 : -1),
    });
  }
};
