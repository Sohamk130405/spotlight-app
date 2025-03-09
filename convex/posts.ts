import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return await ctx.storage.generateUploadUrl();
});

export const getFeedPosts = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    // get all posts
    const posts = await ctx.db.query("posts").order("desc").collect();
    if (posts.length === 0) return [];

    //  enhance post with user data and interaction status
    const postWithInfo = await Promise.all(
      posts.map(async (post) => {
        const postAuhtor = (await ctx.db.get(post.userId))!;
        const like = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id)
          )
          .first();

        const bookmark = await ctx.db
          .query("bookmarks")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id)
          )
          .first();

        return {
          ...post,
          author: {
            _id: postAuhtor?._id,
            username: postAuhtor?.username,
            image: postAuhtor?.image,
          },
          isLiked: !!like,
          isBookmarked: !!bookmark,
        };
      })
    );
    return postWithInfo;
  },
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    caption: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image not found");

    // create post
    const postId = await ctx.db.insert("posts", {
      ...args,
      userId: currentUser._id,
      imageUrl,
      likes: 0,
      comments: 0,
    });

    // increment users posts by 1
    await ctx.db.patch(currentUser._id, { posts: currentUser.posts + 1 });

    return postId;
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", currentUser._id).eq("postId", postId)
      )
      .first();
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not exist");

    if (existing) {
      // remove like
      await ctx.db.delete(existing._id);
      await ctx.db.patch(postId, {
        likes: post.likes - 1,
      });
      return false;
    } else {
      // add like

      await ctx.db.insert("likes", { postId, userId: currentUser._id });
      await ctx.db.patch(postId, {
        likes: post.likes + 1,
      });

      // send notification
      if (currentUser._id !== post.userId) {
        await ctx.db.insert("notifications", {
          receiverId: post.userId,
          senderId: currentUser._id,
          type: "like",
          postId,
        });
      }

      return true;
    }
  },
});

export const remove = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const post = await ctx.db.get(postId);
    if (!post) throw new ConvexError("Post not found");
    if (currentUser._id !== post.userId) throw new ConvexError("Unauthorized");

    // Fetch related data in parallel
    const [likes, comments, bookmarks] = await Promise.all([
      ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .collect(),
      ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .collect(),
      ctx.db
        .query("bookmarks")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .collect(),
    ]);

    // Sequentially delete likes, comments, and bookmarks
    for (const like of likes) await ctx.db.delete(like._id);
    for (const comment of comments) await ctx.db.delete(comment._id);
    for (const bookmark of bookmarks) await ctx.db.delete(bookmark._id);

    // Delete storage file if it exists
    if (post.storageId) {
      await ctx.storage.delete(post.storageId);
    }

    // Delete the post
    await ctx.db.delete(postId);

    // Update the user's post count
    await ctx.db.patch(currentUser._id, {
      posts: Math.max(0, (currentUser.posts || 0) - 1),
    });
  },
});


