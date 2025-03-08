import { styles } from "@/styles/feed.styles";
import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { signOut } = useAuth();
  return (
    <View style={styles.container}>
      {/* <Text style={styles.captionText}>Feed Screen In Tabs</Text> */}
      <TouchableOpacity onPress={() => signOut()}>
        <Text style={{ color: "white" }}> Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}
