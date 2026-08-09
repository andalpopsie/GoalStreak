import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, Switch, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Colors, Typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../services/firebase';
import { useModeration } from '../hooks/useModeration';
import { photoService } from '../services/photoService';
import type { SsoProviderId } from '../services/ssoService';
import { openPrivacyPolicy, openTermsOfService, openSupport } from '../utils/linkingUtils';
import { trackScreen, trackEvent } from '../services/enhancedAnalyticsService';
import { motivationalNotificationService, notificationPreferencesService, AppNotificationPreferences } from '../services/motivationalNotificationService';
import BadgeShowcase from '../components/profile/BadgeShowcase';
import { validateUsername, isUsernameAvailable, reserveUsername, releaseUsername } from '../utils/usernameUtils';
import FeedbackModal from '../components/feedback/FeedbackModal';
import ProPaywallModal from '../components/common/ProPaywallModal';
import ReportReasonSheet from '../components/social/ReportReasonSheet';
import { ReportReason } from '../types/social';

export default function ProfileScreen() {
  const {
    user,
    isAuthenticated,
    logout,
    resetPassword,
    updateUserProfile,
    deleteAccount,
    connectedProviders,
    linkProvider,
    unlinkProvider,
  } = useAuth();
  const { blockUser, reportContent } = useModeration();
  const navigation = useNavigation<any>();
  const route = useRoute();

  // ProfileScreen serves double duty: the current user's own profile (the Profile
  // tab, no params) and — when opened with a `userId` param — another user's
  // profile. Block/report actions are only surfaced when viewing SOMEONE ELSE
  // (R1.1, R4.1); the Blocked Users management entry is only shown on the current
  // user's own profile.
  const routeParams = (route.params ?? {}) as { userId?: string; displayName?: string };
  const targetUserId = routeParams.userId;
  const isOwnProfile = !targetUserId || targetUserId === user?.id;
  const targetName = routeParams.displayName?.trim() || 'this user';

  const [showReportSheet, setShowReportSheet] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showPaywallPreview, setShowPaywallPreview] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [editedName, setEditedName] = useState(user?.displayName || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Tracks which SSO provider is mid-link/unlink so the row shows a spinner and
  // is non-interactive while the native provider flow runs (R8.1, R8.6).
  const [linkingProvider, setLinkingProvider] = useState<SsoProviderId | null>(null);

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

  const handleDeleteAccountPress = () => {
    // Provider-aware entry point (R6.1). Email/password users re-authenticate by
    // typing their password, so we show the password modal. SSO users have no
    // password — the re-auth prompt appears via the native provider flow — so we
    // confirm inline and delete without collecting a password.
    const providerId = auth.currentUser?.providerData[0]?.providerId;

    if (providerId === 'password') {
      setDeleteAccountPassword('');
      setShowDeleteAccountModal(true);
      return;
    }

    Alert.alert(
      'Delete Account?',
      'This permanently deletes your account and all of your data. This cannot be undone. You may be asked to confirm with your sign-in provider.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => runAccountDeletion(),
        },
      ]
    );
  };

  // Shared deletion runner for both the password modal and the SSO confirmation.
  // `password` is passed only for the email/password branch.
  const runAccountDeletion = async (password?: string) => {
    setIsDeletingAccount(true);
    try {
      trackEvent('account_deletion_requested', { user_id: user?.id });
      await deleteAccount(password);
      // Auth listener will navigate the user to the login screen automatically
      // once Firebase Auth confirms the user has been deleted.
      setShowDeleteAccountModal(false);
      setDeleteAccountPassword('');
    } catch (error: any) {
      Alert.alert('Could Not Delete Account', error.message || 'Please try again.');
      trackEvent('account_deletion_failed', {
        user_id: user?.id,
        error_message: error.message,
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deleteAccountPassword.trim()) {
      Alert.alert('Password Required', 'Please enter your password to confirm.');
      return;
    }
    await runAccountDeletion(deleteAccountPassword);
  };

  const handleCancelDeleteAccount = () => {
    if (isDeletingAccount) return;
    setShowDeleteAccountModal(false);
    setDeleteAccountPassword('');
  };

  // ── Moderation: block / report another user (R1.1, R1.6, R1.7, R4.1) ──

  // Confirm-then-block. On success show a confirmation and dismiss the profile
  // view (R1.6); on failure show an error and leave state unchanged (R1.7). The
  // useModeration hook applies an optimistic local add and reconciles via its
  // block-set subscription, so a failed write never desyncs the UI.
  const handleBlockUser = () => {
    if (!targetUserId) return;
    Alert.alert(
      `Block ${targetName}?`,
      "You'll stop seeing each other.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              trackEvent('user_blocked', { blocked_user_id: targetUserId, source: 'profile' });
              await blockUser(targetUserId);
              Alert.alert('Blocked', `You blocked ${targetName}`);
              // Dismiss the blocked user's profile after a successful block.
              if (navigation.canGoBack?.()) {
                navigation.goBack();
              }
            } catch (error: any) {
              trackEvent('user_block_failed', {
                blocked_user_id: targetUserId,
                error_message: error?.message,
              });
              Alert.alert('Error', "Couldn't block user. Please try again.");
            }
          },
        },
      ]
    );
  };

  // The report write happens here; ReportReasonSheet drives its own
  // success/error feedback (resolve = success, throw = failure — R4.6/R4.7).
  const handleReportSubmit = async (reason: ReportReason) => {
    if (!targetUserId) return;
    await reportContent({
      reportedUserId: targetUserId,
      contentType: 'user',
      contentId: targetUserId, // for a `user` report, contentId == reportedUserId (R4.9)
      reason,
    });
  };

  // Overflow (⋯) menu shown on another user's profile. Report is separated from
  // the destructive Block action per the UX standards.
  const handleOpenModerationMenu = () => {
    Alert.alert(targetName, undefined, [
      { text: 'Report user', onPress: () => setShowReportSheet(true) },
      { text: 'Block user', style: 'destructive', onPress: handleBlockUser },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleOpenBlockedUsers = () => {
    // TODO(report-and-block 12.1): navigate to the BlockedUsersScreen once it is
    // created and registered in AppNavigator — e.g. navigation.navigate('BlockedUsers').
    // Until then, degrade gracefully instead of crashing on an unknown route.
    try {
      navigation.navigate('BlockedUsers');
    } catch {
      Alert.alert('Blocked Users', 'Manage the users you\'ve blocked — coming soon.');
    }
  };

  // ── Account linking: connect / disconnect Apple & Google (R8.3, R8.1, R8.6, R8.7) ──

  // A provider is "connected" iff its provider id is a member of the account's
  // linked-provider set exposed by useAuth (R8.3, design Property 9).
  const isProviderConnected = (provider: SsoProviderId): boolean =>
    connectedProviders.includes(provider);

  // Connecting links the provider to the current account (R8.1); disconnecting
  // unlinks it, guarded so the last remaining sign-in provider can't be removed
  // (R8.7) — that guard lives in useAuth.unlinkProvider and surfaces as an error
  // message here. Both paths confirm success and route failures to an alert.
  const handleToggleProvider = async (provider: SsoProviderId) => {
    const label = provider === 'apple.com' ? 'Apple' : 'Google';
    const connected = isProviderConnected(provider);

    if (connected) {
      Alert.alert(
        `Disconnect ${label}?`,
        `You'll no longer be able to sign in with ${label}. At least one sign-in method must stay connected.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              setLinkingProvider(provider);
              try {
                trackEvent('sso_provider_unlink_requested', { provider, user_id: user?.id });
                await unlinkProvider(provider);
                Alert.alert(`${label} disconnected`, `${label} is no longer connected to your account.`);
              } catch (error: any) {
                // Includes the last-provider-guard rejection (R8.7).
                Alert.alert('Could Not Disconnect', error?.message || 'Please try again.');
              } finally {
                setLinkingProvider(null);
              }
            },
          },
        ]
      );
      return;
    }

    setLinkingProvider(provider);
    try {
      trackEvent('sso_provider_link_requested', { provider, user_id: user?.id });
      await linkProvider(provider);
      Alert.alert(`${label} connected`, `You can now sign in with ${label}.`);
    } catch (error: any) {
      Alert.alert('Could Not Connect', error?.message || 'Please try again.');
    } finally {
      setLinkingProvider(null);
    }
  };

  // Renders one connect/disconnect row. Connection state is conveyed by BOTH an
  // icon and text (never color alone) for accessibility: a filled check + label
  // "Connected" when linked, an outline "+" + label "Not connected" otherwise.
  const renderProviderRow = (
    provider: SsoProviderId,
    label: string,
    iconName: keyof typeof Ionicons.glyphMap,
    isLast: boolean,
  ) => {
    const connected = isProviderConnected(provider);
    const busy = linkingProvider === provider;
    const key = provider === 'apple.com' ? 'apple' : 'google';

    return (
      <TouchableOpacity
        style={[styles.row, isLast && styles.rowLast]}
        onPress={() => handleToggleProvider(provider)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy, selected: connected }}
        accessibilityLabel={`${connected ? 'Disconnect' : 'Connect'} ${label}. Currently ${connected ? 'connected' : 'not connected'}.`}
        testID={`sso-provider-row-${key}`}
      >
        <View style={styles.iconChip}>
          <Ionicons name={iconName} size={20} color={Colors.primaryText} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
        {busy ? (
          <ActivityIndicator
            size="small"
            color={Colors.accent1}
            accessibilityLabel={`${connected ? 'Disconnecting' : 'Connecting'} ${label}`}
          />
        ) : (
          <View
            style={styles.ssoStatusRow}
            testID={`sso-status-${key}`}
            accessibilityLabel={connected ? `${label} connected` : `${label} not connected`}
          >
            <Ionicons
              name={connected ? 'checkmark-circle' : 'add-circle-outline'}
              size={18}
              color={connected ? Colors.success : Colors.accent1}
            />
            <Text
              style={[
                styles.ssoStatusText,
                { color: connected ? Colors.success : Colors.accent1 },
              ]}
            >
              {connected ? 'Connected' : 'Not connected'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };



  // An account can reset its password only if it has the email/password provider
  // linked; SSO-only accounts (Apple/Google) have no password, so the row hides.
  const isEmailProvider = connectedProviders.includes('password');

  // Sends a Firebase password-reset email to the account's address (email
  // provider only). Confirmed first so an accidental tap doesn't fire an email.
  const handleResetPassword = () => {
    const email = user?.email;
    if (!email) {
      Alert.alert('Reset Password', 'No email is associated with this account.');
      return;
    }
    Alert.alert(
      'Reset Password',
      `We'll email a password reset link to ${email}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              trackEvent('password_reset_requested', { user_id: user?.id, source: 'profile' });
              await resetPassword(email);
              Alert.alert('Check Your Email', `A password reset link was sent to ${email}.`);
            } catch (error: any) {
              Alert.alert('Could Not Send', error?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  // Generic settings row: icon chip + label + chevron. Used across the Account
  // and Support sections so every row shares the same rhythm and touch target.
  const renderMenuRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    onPress: () => void,
    opts?: { isLast?: boolean; danger?: boolean; accessibilityLabel?: string; testID?: string },
  ) => {
    const danger = !!opts?.danger;
    return (
      <TouchableOpacity
        style={[styles.row, opts?.isLast && styles.rowLast]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={opts?.accessibilityLabel ?? label}
        testID={opts?.testID}
      >
        <View style={[styles.iconChip, danger && styles.iconChipDanger]}>
          <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.primaryText} />
        </View>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.gray.medium} />
      </TouchableOpacity>
    );
  };

  return (
    // The tab navigator already renders the "Profile" header in the top safe
    // area, so exclude the top edge here to avoid a redundant inset/gap.
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {!isOwnProfile && (
          <View style={styles.moderationHeader}>
            <TouchableOpacity
              style={styles.overflowButton}
              onPress={handleOpenModerationMenu}
              accessibilityRole="button"
              accessibilityLabel={`More actions for ${targetName}`}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={Colors.primaryText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Profile card: avatar + identity + edit affordance (own profile). */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.profileAvatarWrap}
            onPress={isOwnProfile ? showImagePicker : undefined}
            activeOpacity={isOwnProfile ? 0.7 : 1}
            disabled={!isOwnProfile}
            accessibilityLabel={isOwnProfile ? 'Change profile photo' : undefined}
          >
            {isUploading ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                accessibilityLabel="Uploading profile photo"
              />
            ) : isOwnProfile && profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileAvatar} resizeMode="cover" />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Ionicons name="person" size={28} color={Colors.accent2} />
              </View>
            )}
            {isOwnProfile && (
              <View style={styles.profileCameraBadge}>
                <Ionicons name="camera" size={12} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {isOwnProfile ? (user?.displayName || 'User') : targetName}
            </Text>
            {isOwnProfile && !!user?.email && (
              <View style={styles.profileEmailRow}>
                <Ionicons
                  name="mail-outline"
                  size={14}
                  color={Colors.gray.dark}
                  style={styles.profileEmailIcon}
                />
                <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
              </View>
            )}
            {isOwnProfile && !!user?.username && (
              <Text style={styles.profileUsername}>@{user.username}</Text>
            )}
          </View>

          {isOwnProfile && (
            <TouchableOpacity
              style={styles.profileEditButton}
              onPress={() => setShowEditModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="create-outline" size={22} color={Colors.primaryText} />
            </TouchableOpacity>
          )}
        </View>

        {isOwnProfile && (
          <>
            {/* Badge Showcase */}
            <BadgeShowcase
              refreshKey={0}
              onViewAll={() => Alert.alert('Coming Soon', 'Full achievements view coming soon!')}
            />

            {/* Account */}
            <Text style={styles.sectionHeader}>Account</Text>
            <View style={styles.sectionCard}>
              {renderMenuRow('person-outline', 'Edit Profile', () => setShowEditModal(true))}
              {renderMenuRow('notifications-outline', 'Notifications', () => setShowNotificationsModal(true))}
              {isEmailProvider &&
                renderMenuRow('key-outline', 'Reset Password', handleResetPassword)}
              {renderMenuRow('ban-outline', 'Blocked Users', handleOpenBlockedUsers, {
                isLast: !__DEV__,
                accessibilityLabel: 'Manage blocked users',
              })}
              {__DEV__ &&
                renderMenuRow('flask-outline', 'Preview Pro Paywall', () => setShowPaywallPreview(true), {
                  isLast: true,
                  accessibilityLabel: 'Preview Pro paywall (dev only)',
                })}
            </View>

            {/* Connected Accounts — Apple / Google linking (iOS-first) */}
            {Platform.OS === 'ios' && (
              <>
                <Text style={styles.sectionHeader}>Connected Accounts</Text>
                <View style={styles.sectionCard} testID="sso-connected-accounts">
                  {renderProviderRow('apple.com', 'Apple', 'logo-apple', false)}
                  {renderProviderRow('google.com', 'Google', 'logo-google', true)}
                </View>
              </>
            )}

            {/* Support & Help */}
            <Text style={styles.sectionHeader}>Support & Help</Text>
            <View style={styles.sectionCard}>
              {renderMenuRow('chatbubble-ellipses-outline', 'Send Feedback', () => setShowFeedbackModal(true))}
              {renderMenuRow('book-outline', 'Learn & Insights', handleLearnPress)}
              {renderMenuRow('lock-closed-outline', 'Privacy Policy', openPrivacyPolicy)}
              {renderMenuRow('document-text-outline', 'Terms of Service', openTermsOfService)}
              {renderMenuRow('help-circle-outline', 'Help & Support', openSupport, { isLast: true })}
            </View>

            {/* Account actions */}
            <View style={styles.sectionCard}>
              {renderMenuRow('log-out-outline', 'Sign Out', handleLogout, { danger: true })}
              {renderMenuRow('trash-outline', 'Delete Account', handleDeleteAccountPress, {
                danger: true,
                isLast: true,
                accessibilityLabel: 'Delete account permanently',
              })}
            </View>

            {memberSince ? (
              <Text style={styles.memberSince}>Member since {memberSince}</Text>
            ) : null}
            <Text style={styles.footerCopyright}>© {new Date().getFullYear()} Goalfer</Text>
          </>
        )}
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

      {/* Report user reason sheet (only relevant when viewing another user) */}
      <ReportReasonSheet
        visible={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        onSubmit={handleReportSubmit}
        title="Report user"
        subjectLabel={targetName}
      />

      {/* Dev-only: Pro Paywall preview */}
      {__DEV__ && (
        <ProPaywallModal
          visible={showPaywallPreview}
          onClose={() => setShowPaywallPreview(false)}
          onSuccess={() => {
            setShowPaywallPreview(false);
            Alert.alert(
              'Preview',
              'Paywall reported success. (No real purchase was made.)'
            );
          }}
        />
      )}

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccountModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelDeleteAccount}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelDeleteAccount} disabled={isDeletingAccount}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.deleteWarningCard}>
              <Ionicons name="warning" size={40} color={Colors.error} />
              <Text style={styles.deleteWarningTitle}>This cannot be undone</Text>
              <Text style={styles.deleteWarningBody}>
                Deleting your account will permanently remove:
              </Text>
              <View style={styles.deleteWarningList}>
                <Text style={styles.deleteWarningListItem}>• Your profile and account info</Text>
                <Text style={styles.deleteWarningListItem}>• All habits, streaks, and progress data</Text>
                <Text style={styles.deleteWarningListItem}>• Friends and social activity</Text>
                <Text style={styles.deleteWarningListItem}>• Group memberships and shared content</Text>
                <Text style={styles.deleteWarningListItem}>• Profile photos and cached data</Text>
              </View>
              <Text style={styles.deleteWarningBody}>
                Your data cannot be recovered after deletion.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm with your password</Text>
              <TextInput
                style={styles.textInput}
                value={deleteAccountPassword}
                onChangeText={setDeleteAccountPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.accent2}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDeletingAccount}
                accessibilityLabel="Password to confirm account deletion"
              />
            </View>

            <TouchableOpacity
              style={[styles.deleteConfirmButton, isDeletingAccount && styles.deleteConfirmButtonDisabled]}
              onPress={handleConfirmDeleteAccount}
              disabled={isDeletingAccount || !deleteAccountPassword.trim()}
              accessibilityRole="button"
              accessibilityLabel="Permanently delete my account"
            >
              {isDeletingAccount ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color={Colors.white} />
                  <Text style={styles.deleteConfirmButtonText}>Permanently Delete Account</Text>
                </>
              )}
            </TouchableOpacity>
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
  // ── Moderation overflow header (another user's profile) ──
  moderationHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,              // 8 × 2 (base)
    paddingTop: 8,                      // 8 × 1 (tight)
  },
  overflowButton: {
    width: 48,                          // 8 × 6 (touch target)
    height: 48,                         // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
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
  // ── Redesigned settings layout ──
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,               // 8 × 2 (base)
    marginTop: 8,                       // 8 × 1 (tight)
    marginBottom: 24,                   // 8 × 3 (comfortable)
    padding: 16,                        // 8 × 2 (base)
    backgroundColor: Colors.white,
    borderRadius: 16,                   // 8 × 2
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  profileAvatarWrap: {
    width: 56,                          // 8 × 7
    height: 56,                         // 8 × 7
    marginRight: 16,                    // 8 × 2 (base)
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 56,                          // 8 × 7
    height: 56,                         // 8 × 7
    borderRadius: 28,
  },
  profileAvatarPlaceholder: {
    width: 56,                          // 8 × 7
    height: 56,                         // 8 × 7
    borderRadius: 28,
    backgroundColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,                       // subheading
    fontWeight: '700',                  // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
  },
  profileEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  profileEmailIcon: {
    marginRight: 4,
  },
  profileEmail: {
    flexShrink: 1,
    fontSize: 14,                       // caption
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray.dark,
  },
  profileUsername: {
    fontSize: 14,                       // caption
    color: Colors.accent1,
    fontWeight: '500',                  // medium
    fontFamily: Typography.fontFamily.medium,
    marginTop: 2,
  },
  profileEditButton: {
    width: 40,                          // 8 × 5
    height: 40,                         // 8 × 5
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,                      // 8 × 1 (tight)
  },
  sectionHeader: {
    fontSize: 20,                       // subheading
    fontWeight: '700',                  // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
    marginLeft: 24,                     // 8 × 3 (comfortable)
    marginTop: 8,                       // 8 × 1 (tight)
    marginBottom: 12,                   // 8 × 1.5
  },
  sectionCard: {
    marginHorizontal: 16,               // 8 × 2 (base)
    marginBottom: 24,                   // 8 × 3 (comfortable)
    backgroundColor: Colors.white,
    borderRadius: 16,                   // 8 × 2
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,                // comfortable within a 64px row
    paddingHorizontal: 16,              // 8 × 2 (base)
    minHeight: 64,                      // 8 × 8 (touch target)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconChip: {
    width: 40,                          // 8 × 5
    height: 40,                         // 8 × 5
    borderRadius: 20,
    backgroundColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,                    // 8 × 2 (base)
  },
  iconChipDanger: {
    backgroundColor: Colors.error + '15', // 15% red tint
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,                       // body
    color: Colors.primaryText,
    fontWeight: '500',                  // medium
    fontFamily: Typography.fontFamily.medium,
  },
  rowLabelDanger: {
    color: Colors.error,
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
  sectionLabel: {
    fontSize: 12,                       // small
    fontWeight: '600',                  // semibold
    color: Colors.secondaryText,
    letterSpacing: 0.5,
    marginHorizontal: 24,               // 8 * 3 (comfortable)
    marginBottom: 8,                    // 8 * 1 (tight)
  },
  ssoStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                             // 8 * 1 (tight) icon + label pair
  },
  ssoStatusText: {
    fontSize: 14,                       // caption
    fontWeight: '600',                  // semibold
    fontFamily: Typography.fontFamily.semibold,
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
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray.medium,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,                   // 8 × 3 (breathing room at the bottom)
  },
  // ── Delete Account Modal Styles ──
  menuItemLast: {
    borderBottomWidth: 0,
  },
  deleteWarningCard: {
    backgroundColor: Colors.error + '10',  // 10% opacity tint
    borderRadius: 16,                       // 8 * 2
    padding: 24,                            // 8 * 3 (comfortable)
    marginTop: 16,                          // 8 * 2 (base)
    marginBottom: 24,                       // 8 * 3 (comfortable)
    alignItems: 'center',
  },
  deleteWarningTitle: {
    fontSize: 20,                           // subheading
    fontWeight: '700',                      // bold
    color: Colors.error,
    marginTop: 8,                           // 8 * 1 (tight)
    marginBottom: 16,                       // 8 * 2 (base)
    textAlign: 'center',
  },
  deleteWarningBody: {
    fontSize: 16,                           // body
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 16,                       // 8 * 2 (base)
    lineHeight: 24,                         // 16 * 1.5
  },
  deleteWarningList: {
    alignSelf: 'stretch',
    marginBottom: 8,                        // 8 * 1 (tight)
  },
  deleteWarningListItem: {
    fontSize: 14,                           // caption
    color: Colors.primaryText,
    marginBottom: 8,                        // 8 * 1 (tight)
    lineHeight: 20,                         // 14 * 1.43
  },
  deleteConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    borderRadius: 12,                       // 8 * 1.5
    paddingVertical: 16,                    // 8 * 2 (base)
    paddingHorizontal: 24,                  // 8 * 3 (comfortable)
    minHeight: 56,                          // 8 * 7 (touch target)
    gap: 8,                                 // 8 * 1 (tight)
    marginTop: 8,                           // 8 * 1 (tight)
    marginBottom: 32,                       // 8 * 4 (loose)
  },
  deleteConfirmButtonDisabled: {
    opacity: 0.6,
  },
  deleteConfirmButtonText: {
    fontSize: 16,                           // body
    fontWeight: '600',                      // semibold
    color: Colors.white,
  },
});
