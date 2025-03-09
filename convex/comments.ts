import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const getAllComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) throw new ConvexError("Post not found");
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    const commentsWithInfo = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: {
            fullname: user!.fullname,
            image: user!.image,
          },
        };
      })
    );
    return commentsWithInfo;
  },
});

export const addComment = mutation({
  args: {
    content: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, { content, postId }) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const post = await ctx.db.get(postId);
    if (!post) throw new ConvexError("Post not found");

    // create comment
    const commentId = await ctx.db.insert("comments", {
      userId: currentUser._id,
      postId,
      content,
    });

    // increment comment count
    await ctx.db.patch(postId, {
      comments: post.comments + 1,
    });

    // send notification
    if (currentUser._id !== post.userId) {
      await ctx.db.insert("notifications", {
        receiverId: post.userId,
        senderId: currentUser._id,
        type: "comment",
        postId,
      });
    }
    return commentId;
  },
});
