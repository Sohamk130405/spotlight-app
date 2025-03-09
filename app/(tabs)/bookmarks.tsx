import { View, Text, ScrollView } from "react-native";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loader from "@/components/Loader";
import NotFound from "@/components/NotFound";
import { styles } from "@/styles/feed.styles";
import { Image } from "expo-image";

export default function Bookmarks() {
  const bookmarks = useQuery(api.bookmarks.getBookmarks);
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
            <View key={post?._id} style={{ width: "33.33%", padding: 1 }}>
              <Image
                source={post?.imageUrl}
                style={{ width: "100%", aspectRatio: 1 }}
                contentFit="cover"
                transition={200}
                cachePolicy={"memory-disk"}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <NotFound message="No bookmarks yet" />
      )}
    </View>
  );
}
