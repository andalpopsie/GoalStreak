import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';
import { photoService } from '../services/photoService';
import { openPrivacyPolicy, openTermsOfService, openSupport } from '../utils/linkingUtils';
import { trackScreen, trackEvent } from '../services/enhancedAnalyticsService';
import { motivationalNotificationService } from '../services/motivationalNotificationService';
import { inactivityNudgeService } from '../services/inactivityNudgeService';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [editedName, setEditedName] = useState(user?.displayName || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [isUploading, setIsUploading] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    badge: true,
    dailyReminder: true,
    streakAlerts: true,
    dailyMotivation: false, // Daily motivational notifications
    inactivityNudges: true, // Playful nudges when inactive
  });

  useEffect(() => {
    // Track screen view
    trackScreen('Profile', { screen_class: 'ProfileScreen' });
    trackEvent('profile_screen_viewed', {
      user_id: user?.id,
      has_profile_image: !!profileImage
    });
  }, [user?.id, profileImage]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProfileImage();
      loadNotificationSettings();
      setupNotifications();
    }
  }, [user?.id, isAuthenticated]);

  const setupNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
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
      
      // Handle daily motivation notifications
      if (newSettings.dailyMotivation) {
        await motivationalNotificationService.scheduleDailyNotification(9, 0); // 9:00 AM default
      } else {
        await motivationalNotificationService.cancelDailyNotification();
      }

      // Handle inactivity nudges
      await inactivityNudgeService.setEnabled(newSettings.inactivityNudges);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const loadProfileImage = async () => {
    try {
      if (!user?.id) return;

      const imageUri = await photoService.getProfilePhoto(user.id);
      if (imageUri) {
        setProfileImage(imageUri);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Photo Library', onPress: () => pickImage('library') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      setIsUploading(true);

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        if (user?.id) {
          const savedUri = await photoService.saveProfilePhoto(user.id, imageUri);
          setProfileImage(savedUri);
          Alert.alert('Success', 'Profile photo updated successfully!');
        }
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      
      // Don't show error for user cancellation
      if (error?.message?.includes('cancelled') || error?.code === 'UserCancel') {
        return;
      }
      
      const errorMessage = error?.message?.includes('permission')
        ? 'Camera or photo library permission is required. Please check your settings.'
        : 'Failed to update profile photo. Please try again.';

      Alert.alert('Error', errorMessage);

      trackEvent('profile_photo_error', {
        error_message: error?.message || 'Unknown error',
        error_code: error?.code || 'unknown',
        user_id: user?.id
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Here you would typically update the user profile
      // For now, just close the modal
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
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
              // Track logout
              trackEvent('user_logout', {
                user_id: user?.id
              });

              await logout();
            } catch (error: any) {
              trackEvent('logout_error', {
                error_message: error.message,
                user_id: user?.id
              });
              Alert.alert('Error', error.message);
            }
          }
        },
      ]
    );
  };

  // TEMPORARY: Test inactivity nudge
  const handleTestNudge = async () => {
    try {
      await inactivityNudgeService.sendTestNudge();
      Alert.alert('Test Nudge Sent! ⚡', 'Check your notifications in a few seconds. Your habits are calling!');
    } catch (error) {
      console.error('Error sending test nudge:', error);
      Alert.alert('Error', 'Failed to send test nudge. Make sure notifications are enabled.');
    }
  };

  // TEMPORARY: Reset onboarding for testing
  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset your onboarding progress. Restart the app to see the welcome carousel again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetOnboarding();
              Alert.alert('Success', 'Onboarding reset! Restart the app to see the welcome carousel.');
            } catch (error) {
              console.error('Error resetting onboarding:', error);
              Alert.alert('Error', 'Failed to reset onboarding.');
            }
          }
        }
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
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                accessibilityLabel="Uploading profile photo"
              />
            ) : profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color={Colors.accent2} />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color={Colors.white} />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowEditModal(true)}>
            <Ionicons name="person-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowNotificationsModal(true)}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          {/* TEMPORARY: Test Buttons */}
          <TouchableOpacity style={styles.menuItem} onPress={handleTestNudge}>
            <Ionicons name="notifications-outline" size={24} color={Colors.accent1} />
            <Text style={[styles.menuText, { color: Colors.accent1 }]}>⚡ Test Inactivity Nudge</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleResetOnboarding}>
            <Ionicons name="refresh-outline" size={24} color={Colors.accent2} />
            <Text style={[styles.menuText, { color: Colors.accent2 }]}>🔄 Reset Onboarding (Test)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={Colors.error} />
            <Text style={[styles.menuText, { color: Colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Links - Like modern apps */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={openPrivacyPolicy} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity onPress={openTermsOfService} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity onPress={openSupport} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Help & Support</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerCopyright}>© 2024 GoalStreak</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
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
                style={styles.textInput}
                value={editedEmail}
                onChangeText={setEditedEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.accent2}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotificationsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
              <Text style={styles.cancelButton}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Switch
                value={notificationSettings.enabled}
                onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, enabled: value })}
                trackColor={{ false: Colors.accent3, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Sound</Text>
              <Switch
                value={notificationSettings.sound}
                onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, sound: value })}
                trackColor={{ false: Colors.accent3, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Badge</Text>
              <Switch
                value={notificationSettings.badge}
                onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, badge: value })}
                trackColor={{ false: Colors.accent3, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Daily Motivation</Text>
                <Text style={styles.settingDescription}>
                  Get an encouraging message every morning at 9:00 AM
                </Text>
              </View>
              <Switch
                value={notificationSettings.dailyMotivation}
                onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, dailyMotivation: value })}
                trackColor={{ false: Colors.accent3, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Inactivity Nudges ⚡</Text>
                <Text style={styles.settingDescription}>
                  Get playful reminders if you haven't logged habits for 3+ days
                </Text>
              </View>
              <Switch
                value={notificationSettings.inactivityNudges}
                onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, inactivityNudges: value })}
                trackColor={{ false: Colors.accent3, true: Colors.primary }}
                thumbColor={Colors.white}
              />
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
    paddingBottom: 32,                  // 8 * 4 (loose)
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,                // 8 * 4 (loose)
    paddingHorizontal: 24,              // 8 * 3 (comfortable)
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,                   // 8 * 3 (comfortable)
  },
  avatar: {
    width: 120,                         // 8 * 15
    height: 120,                        // 8 * 15
    borderRadius: 60,
    borderWidth: 4,                     // 8 * 0.5
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 120,                         // 8 * 15
    height: 120,                        // 8 * 15
    borderRadius: 60,
    backgroundColor: Colors.accent3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,                     // 8 * 0.5
    borderColor: Colors.white,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,                          // 8 * 5
    height: 40,                         // 8 * 5
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,                       // heading
    fontWeight: '700',                  // bold
    color: Colors.primaryText,
    marginBottom: 8,                    // 8 * 1 (tight)
  },
  userEmail: {
    fontSize: 16,                       // body
    color: Colors.accent2,
  },
  menuSection: {
    marginHorizontal: 16,               // 8 * 2 (base)
    marginBottom: 16,                   // 8 * 2 (base)
    backgroundColor: Colors.white,
    borderRadius: 16,                   // 8 * 2
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,                // 8 * 2 (base)
    paddingHorizontal: 16,              // 8 * 2 (base)
    minHeight: 64,                      // 8 * 8 (touch target)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  menuText: {
    flex: 1,
    fontSize: 16,                       // body
    color: Colors.primaryText,
    marginLeft: 16,                     // 8 * 2 (base)
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,              // 8 * 3 (comfortable)
    paddingVertical: 16,                // 8 * 2 (base)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  modalTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
  },
  cancelButton: {
    fontSize: 16,                       // body
    color: Colors.accent2,
    minWidth: 60,                       // Touch target
    minHeight: 44,                      // Touch target
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  saveButton: {
    fontSize: 16,                       // body
    color: Colors.primary,
    fontWeight: '500',                  // medium
    minWidth: 60,                       // Touch target
    minHeight: 44,                      // Touch target
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,              // 8 * 3 (comfortable)
    paddingTop: 24,                     // 8 * 3 (comfortable)
  },
  inputGroup: {
    marginBottom: 24,                   // 8 * 3 (comfortable)
  },
  inputLabel: {
    fontSize: 16,                       // body
    fontWeight: '500',                  // medium
    color: Colors.primaryText,
    marginBottom: 8,                    // 8 * 1 (tight)
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray.medium,
    borderRadius: 12,                   // 8 * 1.5
    paddingHorizontal: 16,              // 8 * 2 (base)
    paddingVertical: 16,                // 8 * 2 (base)
    fontSize: 16,                       // body
    color: Colors.primaryText,
    backgroundColor: Colors.white,
    minHeight: 56,                      // 8 * 7 (touch target)
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,                // 8 * 2 (base)
    minHeight: 64,                      // 8 * 8 (touch target)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  settingLabel: {
    fontSize: 16,                       // body
    color: Colors.primaryText,
  },
  settingDescription: {
    fontSize: 14,                       // caption
    color: Colors.gray.dark,
    marginTop: 4,                       // 8 * 0.5
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,                // 8 * 4 (loose)
    paddingHorizontal: 24,              // 8 * 3 (comfortable)
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,                   // 8 * 1.5
  },
  footerLink: {
    paddingVertical: 8,                 // 8 * 1 (tight)
    paddingHorizontal: 4,               // 8 * 0.5
  },
  footerLinkText: {
    fontSize: 13,                       // small
    color: Colors.secondaryText,
    textDecorationLine: 'underline',
  },
  footerDivider: {
    fontSize: 13,                       // small
    color: Colors.secondaryText,
    marginHorizontal: 8,                // 8 * 1 (tight)
  },
  footerCopyright: {
    fontSize: 12,                       // caption
    color: Colors.gray.medium,
  },
});
