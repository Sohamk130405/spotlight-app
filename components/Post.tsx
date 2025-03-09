import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { styles } from "@/styles/feed.styles";
import { Link } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import CommentsModal from "./CommentsModal";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/clerk-expo";
// `/${post.author._id}`

export interface PostProps {
  post: {
    _id: Id<"posts">;
    imageUrl: string;
    caption: string;
    likes: number;
    comments: number;
    _creationTime: number;
    isLiked: boolean;
    isBookmarked: boolean;
    author: {
      _id: Id<"users">;
      username: string;
      image: string;
    };
  };
}

export default function Post({ post }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const toggleLike = useMutation(api.posts.toggleLike);
  const toggleBookmark = useMutation(api.bookmarks.toggleBookmark);
  const deletePost = useMutation(api.posts.remove);
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user
      ? {
          clerkId: user?.id,
        }
      : "skip"
  );
  const handleLike = async () => {
    try {
      const res = await toggleLike({ postId: post._id });
      setIsLiked(res);
      setLikesCount((prev) => (res ? prev + 1 : prev - 1));
    } catch (error) {
      console.log("Error in liking post:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost({ postId: post._id });
    } catch (error) {
      console.log("Error in deleting post:", error);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await toggleBookmark({ postId: post._id });
      setIsBookmarked(res);
    } catch (error) {
      console.log("Error in bookmarking post:", error);
    }
  };
  return (
    <View style={styles.post}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Link
          href={
            currentUser?._id === post.author._id
              ? "/(tabs)/profile"
              : `/user/${post.author._id}`
          }
          asChild
        >
          <TouchableOpacity style={styles.postHeaderLeft}>
            <Image
              source={post.author.image}
              style={styles.postAvatar}
              contentFit="cover"
              transition={200}
              cachePolicy={"memory-disk"}
            />
            <Text style={styles.postUsername}>{post.author.username}</Text>
          </TouchableOpacity>
        </Link>
        {/* Based upon user role*/}
        {currentUser?._id !== post.author._id ? (
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={COLORS.white}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
      {/* Post Image */}
      <Image
        source={post.imageUrl}
        style={styles.postImage}
        contentFit="cover"
        transition={200}
        cachePolicy={"memory-disk"}
      />

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity onPress={handleLike}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? COLORS.primary : COLORS.white}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowComments(true)}>
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isBookmarked ? COLORS.primary : COLORS.white}
          />
        </TouchableOpacity>
      </View>

      {/* Post INFO */}
      <View style={styles.postInfo}>
        <Text style={styles.likesText}>
          {likesCount > 0 ? `${likesCount} likes` : "Be the first one to like"}
        </Text>
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>{post.author.username}</Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>
        )}
        {commentsCount > 0 && (
          <TouchableOpacity onPress={() => setShowComments(true)}>
            <Text style={styles.commentText}>
              View {commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.timeAgo}>
          {formatDistanceToNow(post._creationTime, { addSuffix: true })}
        </Text>
      </View>
      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
        postId={post._id}
      />
    </View>
  );
}
