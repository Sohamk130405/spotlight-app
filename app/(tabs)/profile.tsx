import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import Loader from "@/components/Loader";
import { Doc } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { Image } from "expo-image";
import NotFound from "@/components/NotFound";
import Post from "@/components/Post";

export default function Profile() {
  const { userId, signOut } = useAuth();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkId: userId } : "skip"
  );
  const updateProfile = useMutation(api.users.update);
  const [editedProfile, setEditedProfile] = useState({
    fullname: currentUser?.fullname || "",
    username: currentUser?.username || "",
    bio: currentUser?.bio,
  });
  const posts = useQuery(api.posts.getPostsByUser, {});

  const handleUpdate = async () => {
    if (
      editedProfile.fullname.length === 0 ||
      editedProfile.username.length === 0
    )
      return alert("Name fields are required");
    try {
      await updateProfile(editedProfile);
      setIsEditModalVisible(false);
    } catch (error) {
      console.log("Error updating profile:", error);
    }
  };

  if (currentUser === undefined || posts === undefined) return <Loader />;
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{currentUser?.username}</Text>
        </View>
        <TouchableOpacity style={styles.headerRight} onPress={() => signOut()}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarAndStats}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Image
                source={currentUser?.image}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            </View>
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser?.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser?.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser?.followings}</Text>
                <Text style={styles.statLabel}>Followings</Text>
              </View>
            </View>
          </View>
          <Text style={styles.name}>{currentUser?.fullname}</Text>
          {currentUser?.bio && (
            <Text style={styles.bio}>{currentUser?.bio}</Text>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditModalVisible(true)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
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
      {/* Edit Profile Modal */}

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full name</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.fullname}
                  placeholder="enter fullname"
                  placeholderTextColor={COLORS.grey}
                  onChangeText={(text) =>
                    setEditedProfile((prev) => ({ ...prev, fullname: text }))
                  }
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={(text) =>
                    setEditedProfile((prev) => ({ ...prev, username: text }))
                  }
                  value={editedProfile.username}
                  placeholder="enter username"
                  placeholderTextColor={COLORS.grey}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  onChangeText={(text) =>
                    setEditedProfile((prev) => ({ ...prev, bio: text }))
                  }
                  value={editedProfile.bio}
                  placeholder="write something about you..."
                  placeholderTextColor={COLORS.grey}
                  multiline
                  numberOfLines={4}
                />
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdate}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

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
