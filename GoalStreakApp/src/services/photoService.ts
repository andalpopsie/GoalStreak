import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Toggle between development (local) and production (cloud) mode
const USE_CLOUD_STORAGE = !__DEV__; // Production uses cloud, development uses local

export class PhotoService {
  private storage = getStorage();
  private auth = getAuth();

  /**
   * Compress and optimize image
   */
  private async compressImage(uri: string): Promise<string> {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  }

  /**
   * Upload profile photo - automatically chooses cloud or local based on mode
   */
  async uploadProfilePhoto(userId: string, imageUri: string): Promise<string> {
    if (USE_CLOUD_STORAGE) {
      return await this.uploadToCloud(userId, imageUri);
    } else {
      return await this.saveLocally(userId, imageUri);
    }
  }

  /**
   * Upload to Firebase Storage (Production)
   */
  private async uploadToCloud(userId: string, imageUri: string): Promise<string> {
    try {
      console.log('📤 Uploading to Firebase Storage...');
      
      if (!this.auth.currentUser) {
        throw new Error('User must be authenticated to upload photos');
      }

      const compressedUri = await this.compressImage(imageUri);
      const response = await fetch(compressedUri);
      const blob = await response.blob();

      const photoRef = ref(this.storage, `profile-photos/${this.auth.currentUser.uid}.jpg`);
      await uploadBytes(photoRef, blob);
      const downloadURL = await getDownloadURL(photoRef);
      
      // Cache locally for offline access
      await this.cacheLocally(userId, downloadURL);
      
      console.log('✅ Photo uploaded to cloud successfully');
      return downloadURL;
    } catch (error) {
      console.error('❌ Cloud upload failed:', error);
      // Fallback to local storage if cloud fails
      return await this.saveLocally(userId, imageUri);
    }
  }

  /**
   * Save locally (Development & Fallback)
   */
  private async saveLocally(userId: string, imageUri: string): Promise<string> {
    try {
      console.log('💾 Saving photo locally...');
      
      const compressedUri = await this.compressImage(imageUri);
      const fileName = `profile_${userId}.jpg`;
      const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: compressedUri,
        to: permanentUri,
      });
      
      await AsyncStorage.setItem(`profileImage_${userId}`, permanentUri);
      
      console.log('✅ Photo saved locally');
      return permanentUri;
    } catch (error) {
      console.error('❌ Error saving photo locally:', error);
      throw new Error('Failed to save profile photo');
    }
  }

  /**
   * Cache cloud photo locally for offline access
   */
  private async cacheLocally(userId: string, downloadURL: string): Promise<void> {
    try {
      const localPath = `${FileSystem.documentDirectory}profile_${userId}_cloud.jpg`;
      const downloadResult = await FileSystem.downloadAsync(downloadURL, localPath);
      
      await AsyncStorage.setItem(`profileImage_${userId}`, downloadResult.uri);
      await AsyncStorage.setItem(`profileImageCloud_${userId}`, downloadURL);
    } catch (error) {
      console.error('Error caching photo:', error);
      // Still save cloud URL for fallback
      await AsyncStorage.setItem(`profileImageCloud_${userId}`, downloadURL);
    }
  }

  /**
   * Get profile photo with smart loading
   */
  async getProfilePhoto(userId: string): Promise<string | null> {
    try {
      if (USE_CLOUD_STORAGE) {
        // Production: Try cache first, then cloud
        const cloudURL = await AsyncStorage.getItem(`profileImageCloud_${userId}`);
        if (cloudURL) {
          const localCache = await AsyncStorage.getItem(`profileImage_${userId}`);
          if (localCache && localCache.startsWith('file://')) {
            const fileInfo = await FileSystem.getInfoAsync(localCache);
            if (fileInfo.exists) {
              return localCache; // Use cached version
            }
          }
          return cloudURL; // Use cloud URL
        }
      }
      
      // Development or fallback: Use local storage
      return await AsyncStorage.getItem(`profileImage_${userId}`);
    } catch (error) {
      console.error('Error getting profile photo:', error);
      return null;
    }
  }

  /**
   * Sync local photo to cloud
   */
  async syncLocalPhotoToCloud(userId: string): Promise<string | null> {
    if (!USE_CLOUD_STORAGE) {
      console.log('📱 Development mode: Using local storage');
      return await this.getProfilePhoto(userId);
    }

    try {
      const localPhoto = await AsyncStorage.getItem(`profileImage_${userId}`);
      if (localPhoto && localPhoto.startsWith('file://')) {
        return await this.uploadToCloud(userId, localPhoto);
      }
      return null;
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      return null;
    }
  }

  /**
   * Delete profile photo
   */
  async deleteProfilePhoto(userId: string): Promise<void> {
    try {
      if (USE_CLOUD_STORAGE && this.auth.currentUser) {
        // Delete from cloud
        const photoRef = ref(this.storage, `profile-photos/${this.auth.currentUser.uid}.jpg`);
        await deleteObject(photoRef);
      }
      
      // Clear local storage
      await AsyncStorage.removeItem(`profileImage_${userId}`);
      await AsyncStorage.removeItem(`profileImageCloud_${userId}`);
      
      // Delete local file
      const fileName = `profile_${userId}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
      }
      
      console.log('Profile photo deleted');
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }
}

export const photoService = new PhotoService();
