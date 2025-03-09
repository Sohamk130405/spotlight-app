import Loader from "@/components/Loader";
import NotFound from "@/components/NotFound";
import Post from "@/components/Post";
import Story from "@/components/Story";
import STORIES from "@/constants/mock-data";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const { signOut } = useAuth();
  const posts = useQuery(api.posts.getFeedPosts);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };
  if (posts === undefined) return <Loader />;
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextInput style={styles.headerTitle}>spotlight</TextInput>
        <TouchableOpacity onPress={() => signOut()}>
          <Ionicons size={24} name="log-out-outline" color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={({ item }) => <Post post={item} />}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          ListHeaderComponent={<StoriesSection />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      ) : (
        <NotFound message="No posts yet" />
      )}
    </View>
  );
}

const StoriesSection = () => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.storiesContainer}
    >
      {/* Stories */}
      {STORIES.map((story) => (
        <Story key={story.id} story={story} />
      ))}
    </ScrollView>
  );
};
