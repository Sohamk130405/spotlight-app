import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
} from "react-native";
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Id } from "@/convex/_generated/dataModel";
import Loader from "@/components/Loader";
import { styles } from "@/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { Image } from "expo-image";
import NotFound from "@/components/NotFound";
import Post from "@/components/Post";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const router = useRouter();
  const profile = useQuery(api.users.get, { id: id as Id<"users"> });
  const posts = useQuery(api.posts.getPostsByUser, {
    userId: id as Id<"users">,
  });
  const isFollowing = useQuery(api.users.isFollowing, {
    followingId: id as Id<"users">,
  });

  const toggleFollow = useMutation(api.users.toggleFollow);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  if (profile === undefined || isFollowing === undefined || posts === undefined)
    return <Loader />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.username}>{profile?.username}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarAndStats}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Image
                source={profile?.image}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            </View>
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile?.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile?.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile?.followings}</Text>
                <Text style={styles.statLabel}>Followings</Text>
              </View>
            </View>
          </View>
          <Text style={styles.name}>{profile?.fullname}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile?.bio}</Text>}
          <TouchableOpacity
            onPress={() => toggleFollow({ followingId: id as Id<"users"> })}
            style={[styles.followButton, isFollowing && styles.followingButton]}
          >
            <Text style={styles.followButtonText}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>

        {posts.length === 0 ? (
          <NotFound message="No posts yet" />
        ) : (
          <FlatList
            data={posts}
            numColumns={3}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setSelectedPost(item)}
              >
                <Image
                  source={item.imageUrl}
                  style={styles.gridImage}
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>

      {/* Selected Post Modal */}
      <Modal
        visible={!!selectedPost}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.postDetailContainer}>
            <View style={styles.postDetailHeader}>
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            {selectedPost && <Post post={selectedPost} />}
          </View>
        </View>
      </Modal>
    </View>
  );
}
