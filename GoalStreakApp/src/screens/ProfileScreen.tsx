import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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

  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    badge: true,
    dailyReminder: true,
    streakAlerts: true,
  });

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProfileImage();
      loadNotificationSettings();
      setupNotifications();
    }
  }, [user?.id, user?.email, isAuthenticated]);

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
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile photo. Please try again.');
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

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={Colors.error} />
            <Text style={[styles.menuText, { color: Colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
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
    paddingBottom: Spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent2,
  },
  menuSection: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent3,
  },
  menuText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    marginLeft: Spacing.md,
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
    borderBottomColor: Colors.accent3,
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
    fontWeight: Typography.fontWeight.medium,
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
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.accent3,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    backgroundColor: Colors.white,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent3,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
  },
});
