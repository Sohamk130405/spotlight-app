import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const getBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    // get all user's bookmarks
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();
    if (bookmarks.length === 0) return [];

    const bookmarksWithPost = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const post = await ctx.db.get(bookmark.postId);
        return post;
      })
    );

    const postWithInfo = await Promise.all(
      bookmarksWithPost.map(async (post) => {
        const like = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post!._id)
          )
          .first();

        const bookmark = await ctx.db
          .query("bookmarks")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post!._id)
          )
          .first();

        return {
          ...post,
          author: {
            _id: currentUser._id,
            username: currentUser.username,
            image: currentUser.image,
          },
          isLiked: !!like,
          isBookmarked: !!bookmark,
        };
      })
    );
    return postWithInfo;
  },
});

export const toggleBookmark = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", currentUser._id).eq("postId", postId)
      )
      .first();
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not exist");

    if (existing) {
      // remove bookmark
      await ctx.db.delete(existing._id);
      return false;
    } else {
      // add bookmark
      await ctx.db.insert("bookmarks", { postId, userId: currentUser._id });
      return true;
    }
  },
});
