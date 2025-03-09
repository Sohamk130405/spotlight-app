import { v } from "convex/values";
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
