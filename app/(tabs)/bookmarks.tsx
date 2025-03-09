import Loader from "@/components/Loader";
import NotFound from "@/components/NotFound";
import Post from "@/components/Post";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { styles as modalStyles } from "@/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Bookmarks() {
  const bookmarks = useQuery(api.bookmarks.getBookmarks);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  if (bookmarks === undefined) return <Loader />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
      </View>
      {bookmarks.length > 0 ? (
        <ScrollView
          contentContainerStyle={{
            padding: 9,
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          {bookmarks.map((post) => (
            <TouchableOpacity
              onPress={() => setSelectedPost(post)}
              key={post?._id}
              style={{ width: "33.33%", padding: 1 }}
            >
              <Image
                source={post?.imageUrl}
                style={{ width: "100%", aspectRatio: 1 }}
                contentFit="cover"
                transition={200}
                cachePolicy={"memory-disk"}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <NotFound message="No bookmarks yet" />
      )}

      {/* Selected Post Modal */}

      <Modal
        visible={!!selectedPost}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={modalStyles.modalBackdrop}>
          <View style={modalStyles.postDetailContainer}>
            <View style={modalStyles.postDetailHeader}>
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
