import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../services/firebase';
import { useHabits } from '../hooks/useHabits';
import { useFriends } from '../hooks/useFriends';
import { photoService } from '../services/photoService';
import { openPrivacyPolicy, openTermsOfService, openSupport } from '../utils/linkingUtils';
import { trackScreen, trackEvent } from '../services/enhancedAnalyticsService';
import { motivationalNotificationService, notificationPreferencesService, AppNotificationPreferences } from '../services/motivationalNotificationService';
import BadgeShowcase from '../components/profile/BadgeShowcase';
import { validateUsername, isUsernameAvailable, reserveUsername, releaseUsername } from '../utils/usernameUtils';
import FeedbackModal from '../components/feedback/FeedbackModal';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, updateUserProfile } = useAuth();
  const { habits, streaks } = useHabits();
  const { friends } = useFriends();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [editedName, setEditedName] = useState(user?.displayName || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Compute profile stats
  const bestStreak = Object.values(streaks).reduce((max, s) => {
    const current = (s as any)?.longestStreak || (s as any)?.currentStreak || 0;
    return current > max ? current : max;
  }, 0);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  const [notificationSettings, setNotificationSettings] = useState<AppNotificationPreferences>({
    enabled: true,
    sound: true,
    badge: true,
    dailyReminder: true,
    streakAlerts: true,
    dailyMotivation: false,
    inactivityNudges: true,
    friendRequests: true,
    comments: true,
    reactions: true,
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
      const prefs = await notificationPreferencesService.load();
      setNotificationSettings(prefs);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async (newSettings: AppNotificationPreferences) => {
    try {
      setNotificationSettings(newSettings);
      await notificationPreferencesService.save(newSettings);
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

  const handleUsernameChange = async (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setEditedUsername(normalized);
    setUsernameError(null);

    if (!normalized || normalized === user?.username) {
      setIsCheckingUsername(false);
      return;
    }

    const validation = validateUsername(normalized);
    if (!validation.isValid) {
      setUsernameError(validation.error || null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const available = await isUsernameAvailable(normalized);
      if (!available) {
        setUsernameError('Username is already taken');
      }
    } catch {
      setUsernameError('Could not check availability');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updates: Partial<{ displayName: string; username: string }> = {};
      
      const trimmedName = editedName.trim();
      const trimmedUsername = editedUsername.trim();

      if (trimmedName && trimmedName !== user?.displayName) {
        updates.displayName = trimmedName;
      }

      // Handle username change
      if (trimmedUsername && trimmedUsername !== user?.username) {
        const validation = validateUsername(trimmedUsername);
        if (!validation.isValid) {
          Alert.alert('Invalid Username', validation.error || 'Please check your username.');
          return;
        }

        const available = await isUsernameAvailable(trimmedUsername);
        if (!available) {
          Alert.alert('Username Taken', 'This username is already in use. Please choose another.');
          return;
        }

        // Release old username, reserve new one
        if (user?.username) {
          await releaseUsername(user.username);
        }
        await reserveUsername(trimmedUsername, user?.id || '');
        updates.username = trimmedUsername;
      }

      if (Object.keys(updates).length === 0) {
        setShowEditModal(false);
        return;
      }

      await updateUserProfile(updates);

      // Also update Firebase Auth display name
      if (updates.displayName && auth.currentUser) {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(auth.currentUser, { displayName: updates.displayName });
      }

      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
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

  const handleLearnPress = () => {
    Alert.alert(
      '📚 Learn & Insights',
      'Coming soon! Read articles about building better habits, staying accountable, and achieving your goals.',
      [{ text: 'OK' }]
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
          {user?.username && (
            <Text style={styles.userUsername}>@{user.username}</Text>
          )}
          <Text style={styles.userEmail}>{user?.email}</Text>
          {memberSince ? (
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          ) : null}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{habits.length}</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{friends.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {/* Badge Showcase */}
        <BadgeShowcase 
          refreshKey={0}
          onViewAll={() => Alert.alert('Coming Soon', 'Full achievements view coming soon!')} 
        />

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

          <TouchableOpacity style={styles.menuItem} onPress={handleLearnPress}>
            <Ionicons name="book-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Learn & Insights</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowFeedbackModal(true)}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Send Feedback</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
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
          <Text style={styles.footerCopyright}>© {new Date().getFullYear()} Goalfer</Text>
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
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.usernameInputRow}>
                <Text style={styles.usernamePrefix}>@</Text>
                <TextInput
                  style={[styles.textInput, styles.usernameInput]}
                  value={editedUsername}
                  onChangeText={handleUsernameChange}
                  placeholder="username"
                  placeholderTextColor={Colors.accent2}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
                {isCheckingUsername && (
                  <ActivityIndicator size="small" color={Colors.accent1} style={styles.usernameSpinner} />
                )}
              </View>
              {usernameError && (
                <Text style={styles.usernameErrorText}>{usernameError}</Text>
              )}
              {editedUsername && !usernameError && !isCheckingUsername && editedUsername !== user?.username && (
                <Text style={styles.usernameAvailableText}>✓ Username available</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.textInput, styles.textInputDisabled]}
                value={editedEmail}
                editable={false}
                placeholder="Enter your email"
                placeholderTextColor={Colors.accent2}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.inputHint}>Email changes are not supported yet</Text>
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

          <ScrollView style={styles.notifContent} showsVerticalScrollIndicator={false}>
            {/* Master Toggle */}
            <View style={styles.notifMasterCard}>
              <View style={styles.notifMasterLeft}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.primary + '15' }]}>  
                  <Ionicons name="notifications" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifMasterLabel}>Allow Notifications</Text>
                  <Text style={styles.notifMasterDesc}>
                    {notificationSettings.enabled ? 'Notifications are on' : 'All notifications are paused'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.enabled}
                onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, enabled: value })}
                trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            {/* General Section */}
            <Text style={styles.notifSectionLabel}>GENERAL</Text>
            <View style={[styles.notifSection, !notificationSettings.enabled && styles.notifSectionDisabled]}>
              <View style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.otherPink + '15' }]}>  
                  <Ionicons name="volume-high" size={20} color={Colors.otherPink} />
                </View>
                <View style={styles.notifRowContent}>
                  <Text style={styles.notifRowLabel}>Sound</Text>
                </View>
                <Switch
                  value={notificationSettings.sound}
                  onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, sound: value })}
                  trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={!notificationSettings.enabled}
                />
              </View>
              <View style={styles.notifDivider} />
              <View style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.error + '15' }]}>  
                  <Ionicons name="ellipse" size={20} color={Colors.error} />
                </View>
                <View style={styles.notifRowContent}>
                  <Text style={styles.notifRowLabel}>Badge Count</Text>
                </View>
                <Switch
                  value={notificationSettings.badge}
                  onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, badge: value })}
                  trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={!notificationSettings.enabled}
                />
              </View>
            </View>

            {/* Habits & Motivation Section */}
            <Text style={styles.notifSectionLabel}>HABITS & MOTIVATION</Text>
            <View style={[styles.notifSection, !notificationSettings.enabled && styles.notifSectionDisabled]}>
              <View style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.accent1 + '15' }]}>  
                  <Ionicons name="sunny" size={20} color={Colors.accent1} />
                </View>
                <View style={styles.notifRowContent}>
                  <Text style={styles.notifRowLabel}>Daily Motivation</Text>
                  <Text style={styles.notifRowDesc}>Encouraging message every morning at 9 AM</Text>
                </View>
                <Switch
                  value={notificationSettings.dailyMotivation}
                  onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, dailyMotivation: value })}
                  trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={!notificationSettings.enabled}
                />
              </View>
              <View style={styles.notifDivider} />
              <View style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.wellnessTeal + '15' }]}>  
                  <Ionicons name="alarm" size={20} color={Colors.wellnessTeal} />
                </View>
                <View style={styles.notifRowContent}>
                  <Text style={styles.notifRowLabel}>Daily Reminder</Text>
                  <Text style={styles.notifRowDesc}>Remind you to complete today's habits</Text>
                </View>
                <Switch
                  value={notificationSettings.dailyReminder}
                  onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, dailyReminder: value })}
                  trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={!notificationSettings.enabled}
                />
              </View>
              <View style={styles.notifDivider} />
              <View style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.accent3 + '15' }]}>  
                  <Ionicons name="flame" size={20} color={Colors.accent3} />
                </View>
                <View style={styles.notifRowContent}>
                  <Text style={styles.notifRowLabel}>Streak Alerts</Text>
                  <Text style={styles.notifRowDesc}>Warn you before a streak is about to break</Text>
                </View>
                <Switch
                  value={notificationSettings.streakAlerts}
                  onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, streakAlerts: value })}
                  trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={!notificationSettings.enabled}
                />
              </View>
              <View style={styles.notifDivider} />
              <View style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.socialPurple + '15' }]}>  
                  <Ionicons name="moon" size={20} color={Colors.socialPurple} />
                </View>
                <View style={styles.notifRowContent}>
                  <Text style={styles.notifRowLabel}>Inactivity Nudges</Text>
                  <Text style={styles.notifRowDesc}>Playful reminders after 3+ days of inactivity</Text>
                </View>
                <Switch
                  value={notificationSettings.inactivityNudges}
                  onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, inactivityNudges: value })}
                  trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={!notificationSettings.enabled}
                />
              </View>
            </View>

            {/* Social Section */}
            <Text style={styles.notifSectionLabel}>SOCIAL</Text>
            <View style={[styles.notifSection, !notificationSettings.enabled && styles.notifSectionDisabled]}>
              <View style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.accent1 + '15' }]}>  
                  <Ionicons name="person-add" size={20} color={Colors.accent1} />
                </View>
                <View style={styles.notifRowContent}>
                  <Text style={styles.notifRowLabel}>Friend Requests</Text>
                  <Text style={styles.notifRowDesc}>When someone wants to connect</Text>
                </View>
                <Switch
                  value={notificationSettings.friendRequests}
                  onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, friendRequests: value })}
                  trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={!notificationSettings.enabled}
                />
              </View>
              <View style={styles.notifDivider} />
              <View style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.productivityNavy + '15' }]}>  
                  <Ionicons name="chatbubble" size={20} color={Colors.productivityNavy} />
                </View>
                <View style={styles.notifRowContent}>
                  <Text style={styles.notifRowLabel}>Comments</Text>
                  <Text style={styles.notifRowDesc}>When someone comments on your activity</Text>
                </View>
                <Switch
                  value={notificationSettings.comments}
                  onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, comments: value })}
                  trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={!notificationSettings.enabled}
                />
              </View>
              <View style={styles.notifDivider} />
              <View style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: Colors.nutritionGreen + '30' }]}>  
                  <Ionicons name="heart" size={20} color={Colors.nutritionGreen} />
                </View>
                <View style={styles.notifRowContent}>
                  <Text style={styles.notifRowLabel}>Reactions</Text>
                  <Text style={styles.notifRowDesc}>When someone reacts to your activity</Text>
                </View>
                <Switch
                  value={notificationSettings.reactions}
                  onValueChange={(value) => saveNotificationSettings({ ...notificationSettings, reactions: value })}
                  trackColor={{ false: Colors.gray.light, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={!notificationSettings.enabled}
                />
              </View>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userId={user?.id}
        userName={user?.displayName}
        source="profile"
      />
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
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,                       // body
    color: Colors.accent1,
    fontWeight: '500',                  // medium
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,                       // body
    color: Colors.accent2,
  },
  memberSince: {
    fontSize: 14,                       // caption
    color: Colors.secondaryText,
    marginTop: 4,
  },
  // ── Stats Row ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,              // 8 × 2 (base)
    marginBottom: 16,                  // 8 × 2 (base)
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 20,               // 8 × 2.5
    paddingHorizontal: 16,             // 8 × 2 (base)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,                      // heading
    fontWeight: '700',                 // bold
    color: Colors.primaryText,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,                      // small
    color: Colors.secondaryText,
    fontWeight: '500',                 // medium
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,                        // 8 × 4
    backgroundColor: Colors.gray.light,
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
  textInputDisabled: {
    backgroundColor: Colors.gray.light,
    color: Colors.secondaryText,
  },
  inputHint: {
    fontSize: 12,                       // small
    color: Colors.secondaryText,
    marginTop: 4,
  },
  usernameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernamePrefix: {
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    color: Colors.accent1,
    marginRight: 4,
    minWidth: 20,
  },
  usernameInput: {
    flex: 1,
  },
  usernameSpinner: {
    position: 'absolute',
    right: 16,                          // 8 × 2 (base)
  },
  usernameErrorText: {
    fontSize: 13,                       // small
    color: Colors.error,
    marginTop: 4,
  },
  usernameAvailableText: {
    fontSize: 13,                       // small
    color: Colors.accent3,
    marginTop: 4,
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
  // ── Notification Modal Styles ──
  notifContent: {
    flex: 1,
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingTop: 16,                    // 8 × 2 (base)
  },
  notifMasterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,                       // 8 × 2 (base)
    marginBottom: 24,                  // 8 × 3 (comfortable)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notifMasterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,                           // 8 × 1.5
    marginRight: 16,                   // 8 × 2 (base)
  },
  notifMasterLabel: {
    fontSize: 16,                      // body
    fontWeight: '600',                 // semibold
    color: Colors.primaryText,
  },
  notifMasterDesc: {
    fontSize: 14,                      // caption
    color: Colors.secondaryText,
    marginTop: 2,
  },
  notifSectionLabel: {
    fontSize: 12,                      // small
    fontWeight: '600',                 // semibold
    color: Colors.secondaryText,
    letterSpacing: 0.5,
    marginBottom: 8,                   // 8 × 1 (tight)
    marginLeft: 4,
  },
  notifSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 24,                  // 8 × 3 (comfortable)
    overflow: 'hidden',
  },
  notifSectionDisabled: {
    opacity: 0.5,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,               // comfortable vertical
    paddingHorizontal: 16,             // 8 × 2 (base)
    minHeight: 56,                     // 8 × 7 (touch target)
  },
  notifRowContent: {
    flex: 1,
    marginRight: 8,                    // 8 × 1 (tight)
  },
  notifRowLabel: {
    fontSize: 16,                      // body
    color: Colors.primaryText,
  },
  notifRowDesc: {
    fontSize: 13,                      // small
    color: Colors.secondaryText,
    marginTop: 2,
    lineHeight: 18,
  },
  notifIconCircle: {
    width: 36,                         // 8 × 4.5
    height: 36,                        // 8 × 4.5
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,                   // 8 × 1.5
  },
  notifDivider: {
    height: 1,
    backgroundColor: Colors.gray.light,
    marginLeft: 64,                    // icon width + margins
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
