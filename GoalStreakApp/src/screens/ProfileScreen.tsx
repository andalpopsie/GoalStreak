import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Load saved profile image on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('useEffect triggered - loading profile image');
      loadProfileImage();
    }
  }, [user?.id, user?.email, isAuthenticated]);

  const loadProfileImage = async () => {
    try {
      console.log('Loading profile image for user:', user?.uid || user?.email);
      console.log('Is authenticated:', isAuthenticated);
      
      // First try to get from Firebase user
      if (user?.photoURL) {
        console.log('Using Firebase photoURL:', user.photoURL);
        setProfileImage(user.photoURL);
        return;
      }
      
      // Then try AsyncStorage for local images
      if (isAuthenticated) {
        const userId = user?.uid || user?.id || user?.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'anonymous';
        const key = `profileImage_${userId}`;
        const savedImage = await AsyncStorage.getItem(key);
        console.log('AsyncStorage key:', key, 'savedImage:', savedImage);
        if (savedImage) {
          setProfileImage(savedImage);
        }
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const saveProfileImage = async (imageUri: string) => {
    try {
      console.log('Saving profile image:', imageUri);
      console.log('User object:', user);
      console.log('User UID:', user?.uid);
      console.log('Is authenticated:', isAuthenticated);
      
      if (!isAuthenticated) {
        Alert.alert('Error', 'Please sign in to save profile photo');
        return;
      }

      // Use email as fallback if uid is not available
      const userId = user?.uid || user?.id || user?.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'anonymous';
      console.log('Using userId:', userId);

      // Create permanent file path
      const fileName = `profile_${userId}.jpg`;
      const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Copy image to permanent location
      await FileSystem.copyAsync({
        from: imageUri,
        to: permanentUri,
      });
      
      console.log('Copied image to permanent location:', permanentUri);
      
      // Save permanent URI to AsyncStorage
      const key = `profileImage_${userId}`;
      await AsyncStorage.setItem(key, permanentUri);
      console.log('Saved to AsyncStorage with key:', key);
      
      setProfileImage(permanentUri);
    } catch (error) {
      console.error('Error saving profile image:', error);
      Alert.alert('Error', 'Failed to save profile photo');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await saveProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a profile photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await saveProfileImage(result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Profile Photo',
      'Choose how you want to add your profile photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={showImagePicker}
            activeOpacity={0.7}
          >
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profileImage}
                pointerEvents="none"
              />
            ) : (
              <Ionicons name="person" size={48} color={Colors.accent2} />
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>
            {isAuthenticated ? user?.displayName || 'User' : 'Welcome to GoalStreak!'}
          </Text>
          <Text style={styles.email}>
            {isAuthenticated ? user?.email : 'Sign in to sync your progress'}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Active Habits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Streaks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {isAuthenticated ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={24} color={Colors.primaryText} />
                <Text style={styles.menuText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                <Text style={[styles.menuText, { color: Colors.error }]}>Sign Out</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Started</Text>
            <View style={styles.authPrompt}>
              <Text style={styles.authPromptText}>
                Sign in to save your habits, track streaks, and connect with friends for accountability!
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Help & FAQ</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="mail-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.accent2,
    position: 'relative',
  },
  profileImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent1,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  menuText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    marginLeft: Spacing.md,
    flex: 1,
  },
  authPrompt: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent1,
    borderStyle: 'dashed',
  },
  authPromptText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
});
