import {
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import Loader from "./Loader";
import Comment from "./Comment";

interface CommentsModalProps {
  postId: Id<"posts">;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
}

export default function CommentsModal({
  isOpen,
  onClose,
  onCommentAdded,
  postId,
}: CommentsModalProps) {
  const [newComment, setNewComment] = useState("");
  const comments = useQuery(api.comments.getAllComments, { postId });
  const addComments = useMutation(api.comments.addComment);
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      addComments({ content: newComment, postId });
      setNewComment("");
      onCommentAdded();
    } catch (error) {
      console.log("Error adding comments:", error);
    }
  };
  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
      transparent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>
        {comments === undefined ? (
          <Loader />
        ) : (
          <FlatList
            data={comments}
            renderItem={({ item }) => <Comment comment={item} />}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.commentsList}
          />
        )}
        <View style={styles.commentInput}>
          <TextInput
            style={styles.input}
            placeholder="write a comment..."
            placeholderTextColor={COLORS.grey}
            multiline
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Text
              style={[
                styles.postButton,
                !newComment.trim() && styles.postButtonDisabled,
              ]}
            >
              Post
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
