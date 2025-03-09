import Loader from "@/components/Loader";
import Post from "@/components/Post";
import Story from "@/components/Story";
import STORIES from "@/constants/mock-data";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import React from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const { signOut } = useAuth();
  const posts = useQuery(api.posts.getFeedPosts);
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Stories */}
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
        {/* Posts */}
        {posts.length === 0 ? (
          <NoPostFound />
        ) : (
          posts.map((post) => <Post key={post._id} post={post} />)
        )}
      </ScrollView>
    </View>
  );
}

const NoPostFound = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 20, color: COLORS.grey, marginTop: 20 }}>
        No posts yet
      </Text>
    </View>
  );
};
