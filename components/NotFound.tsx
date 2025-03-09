import { View, Text } from "react-native";
import React from "react";
import { COLORS } from "@/constants/theme";
import { styles } from "@/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";

export default function NotFound({ message }: { message: string }) {
  return (
    <View style={styles.noPostsContainer}>
      <Ionicons name="image-outline" size={48} color={COLORS.grey} />
      <Text style={styles.noPostsText}>{message}</Text>
    </View>
  );
}
