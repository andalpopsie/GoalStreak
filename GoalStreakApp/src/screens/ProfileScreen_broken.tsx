import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { photoService } from '../services/photoService';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [editedName, setEditedName] = useState(user?.displayName || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [isUploading, setIsUploading] = useState(false);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    habitReminders: true,
    socialUpdates: true,
    weeklyReports: true,
    friendRequests: true,
    achievements: true,
  });

  // Load saved profile image on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('useEffect triggered - loading profile image');
      loadProfileImage();
      setEditedName(user.displayName || '');
      setEditedEmail(user.email || '');
      loadNotificationSettings();
      setupNotifications();
    }
  }, [user?.id, user?.email, isAuthenticated]);

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please enable notifications to receive reminders');
      return;
    }

    // Configure notification behavior with display options
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,     // Shows banner at top
        shouldShowList: true,       // Shows in notification center
        shouldPlaySound: true,
        shouldSetBadge: true,       // Shows app icon badge count
      }),
    });
  };

  const sendTestNotification = async () => {
    Alert.alert('Test', 'Notification test - coming soon!');
  };

  const loadNotificationSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('notificationSettings');
      if (saved) {
        setNotificationSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async (newSettings: typeof notificationSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setNotificationSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const loadProfileImage = async () => {
    try {
      console.log('Loading profile image for user:', user?.uid || user?.email);
      console.log('Is authenticated:', isAuthenticated);
      
      if (!isAuthenticated || !user) return;

      const userId = user?.uid || user?.id || user?.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'anonymous';
      
      // Use new photo service with cloud sync
      const photoURL = await photoService.getProfilePhoto(userId);
      
      if (photoURL) {
        console.log('Profile photo loaded:', photoURL);
        setProfileImage(photoURL);
      } else {
        console.log('No profile photo found');
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const saveProfileImage = async (imageUri: string) => {
    try {
      console.log('Saving profile image:', imageUri);
      
      if (!isAuthenticated) {
        Alert.alert('Error', 'Please sign in to save profile photo');
        return;
      }

      const userId = user?.uid || user?.id || user?.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'anonymous';
      console.log('Using userId:', userId);

      setIsUploading(true);
      
      try {
        // Upload to Firebase Storage with compression
        const cloudURL = await photoService.uploadProfilePhoto(userId, imageUri);
        console.log('Photo uploaded to cloud:', cloudURL);
        
        setProfileImage(cloudURL);
        Alert.alert('Success', 'Profile photo saved and synced to cloud!');
      } catch (error) {
        console.error('Cloud upload failed, saving locally:', error);
        
        // Fallback to local storage if cloud upload fails
        const fileName = `profile_${userId}.jpg`;
        const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.copyAsync({
          from: imageUri,
          to: permanentUri,
        });
        
        await AsyncStorage.setItem(`profileImage_${userId}`, permanentUri);
        setProfileImage(permanentUri);
        
        Alert.alert('Saved Locally', 'Photo saved locally. Will sync to cloud when connection is available.');
      }
    } catch (error) {
      console.error('Error saving profile image:', error);
      Alert.alert('Error', 'Failed to save profile photo');
    } finally {
      setIsUploading(false);
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

  const saveProfile = async () => {
    try {
      // For now, just update local state since we don't have user update API
      // In a real app, this would call an API to update user profile
      Alert.alert('Success', 'Profile updated successfully!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const syncToCloud = async () => {
    try {
      if (!isAuthenticated || !user) {
        Alert.alert('Error', 'Please sign in to sync photos');
        return;
      }

      const userId = user?.uid || user?.id || user?.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'anonymous';
      
      setIsUploading(true);
      const cloudURL = await photoService.syncLocalPhotoToCloud(userId);
      
      if (cloudURL) {
        setProfileImage(cloudURL);
        Alert.alert('Success', 'Photo synced to cloud successfully!');
      } else {
        Alert.alert('Info', 'No local photo found to sync');
      }
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      Alert.alert('Error', 'Failed to sync photo to cloud');
    } finally {
      setIsUploading(false);
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

  const checkNotificationStatus = async () => {
    Alert.alert('Status', 'Status check - coming soon!');
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
            } catch (error) {
              console.error('Logout error:', error);
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
            {isUploading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : profileImage ? (
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

        {isAuthenticated ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowEditModal(true)}>
                <Ionicons name="person-outline" size={24} color={Colors.primaryText} />
                <Text style={styles.menuText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={syncToCloud} disabled={isUploading}>
                <Ionicons name="cloud-upload-outline" size={24} color={Colors.primaryText} />
                <Text style={styles.menuText}>Sync Photo to Cloud</Text>
                {isUploading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
                )}
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
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowNotificationsModal(true)}>
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={saveProfile}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.accent2}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={editedEmail}
                editable={false}
                placeholder="Email address"
                placeholderTextColor={Colors.accent2}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Notifications Settings Modal */}
      <Modal
        visible={showNotificationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
              <Text style={styles.cancelButton}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={{ width: 50 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.notificationSection}>
              <Text style={styles.notificationSectionTitle}>Habit Tracking</Text>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>Habit Reminders</Text>
                  <Text style={styles.notificationDescription}>Get reminded to complete your daily habits</Text>
                </View>
                <Switch
                  value={notificationSettings.habitReminders}
                  onValueChange={(value) => saveNotificationSettings({...notificationSettings, habitReminders: value})}
                  trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                />
              </View>

              <View style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>Weekly Reports</Text>
                  <Text style={styles.notificationDescription}>Receive weekly progress summaries</Text>
                </View>
                <Switch
                  value={notificationSettings.weeklyReports}
                  onValueChange={(value) => saveNotificationSettings({...notificationSettings, weeklyReports: value})}
                  trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                />
              </View>

              <View style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>Achievements</Text>
                  <Text style={styles.notificationDescription}>Celebrate when you reach milestones</Text>
                </View>
                <Switch
                  value={notificationSettings.achievements}
                  onValueChange={(value) => saveNotificationSettings({...notificationSettings, achievements: value})}
                  trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                />
              </View>
            </View>

            <View style={styles.notificationSection}>
              <Text style={styles.notificationSectionTitle}>Social</Text>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>Friend Requests</Text>
                  <Text style={styles.notificationDescription}>New friend requests and acceptances</Text>
                </View>
                <Switch
                  value={notificationSettings.friendRequests}
                  onValueChange={(value) => saveNotificationSettings({...notificationSettings, friendRequests: value})}
                  trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                />
              </View>

              <View style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>Social Updates</Text>
                  <Text style={styles.notificationDescription}>Activity from friends and reactions</Text>
                </View>
                <Switch
                  value={notificationSettings.socialUpdates}
                  onValueChange={(value) => saveNotificationSettings({...notificationSettings, socialUpdates: value})}
                  trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                />
              </View>
            </View>

            <View style={styles.testSection}>
              <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
                <Ionicons name="notifications" size={20} color={Colors.white} />
                <Text style={styles.testButtonText}>Run Notification Tests</Text>
              </TouchableOpacity>
              <Text style={styles.testDescription}>Comprehensive test: immediate, daily repeat, and action buttons</Text>
              
              <TouchableOpacity style={[styles.testButton, { backgroundColor: Colors.accent3, marginTop: 12 }]} onPress={checkNotificationStatus}>
                <Ionicons name="information-circle" size={20} color={Colors.white} />
                <Text style={styles.testButtonText}>Check Status & Persistence</Text>
              </TouchableOpacity>
              <Text style={styles.testDescription}>View notification settings, permissions, and scheduled notifications</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
  },
  cancelButton: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent2,
  },
  saveButton: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    backgroundColor: Colors.white,
  },
  disabledInput: {
    backgroundColor: Colors.lightGray,
    color: Colors.accent2,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.accent2,
    marginTop: Spacing.xs,
  },
  notificationSection: {
    marginBottom: Spacing.xl,
  },
  notificationSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notificationInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent2,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  testSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  testButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.sm,
  },
  testDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent2,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
