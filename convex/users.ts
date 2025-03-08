import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
