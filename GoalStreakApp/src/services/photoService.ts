import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
   * Save profile photo - Cloud first with local cache
   */
  async saveProfilePhoto(userId: string, imageUri: string): Promise<string | null> {
    try {
      const compressedUri = await this.compressImage(imageUri);
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      
      const photoRef = ref(this.storage, `profile-photos/${userId}.jpg`);
      await uploadBytes(photoRef, blob);
      const downloadURL = await getDownloadURL(photoRef);
      
      await AsyncStorage.setItem(`profilePhoto_${userId}`, downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('❌ Error saving profile photo:', error);
      throw new Error('Failed to save profile photo');
    }
  }

  /**
   * Get profile photo - Cloud first with cache
   */
  async getProfilePhoto(userId: string): Promise<string | null> {
    try {
      const cachedUrl = await AsyncStorage.getItem(`profilePhoto_${userId}`);
      if (cachedUrl) {
        return cachedUrl;
      }
      
      const photoRef = ref(this.storage, `profile-photos/${userId}.jpg`);
      const downloadURL = await getDownloadURL(photoRef);
      
      await AsyncStorage.setItem(`profilePhoto_${userId}`, downloadURL);
      
      return downloadURL;
    } catch (error) {
      if (error.code !== 'storage/object-not-found') {
        console.error('❌ Error loading profile photo:', error);
      }
      return null;
    }
  }

  /**
   * Delete profile photo
   */
  async deleteProfilePhoto(userId: string): Promise<void> {
    try {
      const photoRef = ref(this.storage, `profile-photos/${userId}.jpg`);
      await deleteObject(photoRef);
      await AsyncStorage.removeItem(`profilePhoto_${userId}`);
    } catch (error) {
      console.error('❌ Error deleting profile photo:', error);
      throw error;
    }
  }

  /**
   * Clear all cached photos (for debugging)
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const photoKeys = keys.filter(key => key.startsWith('profilePhoto_'));
      await AsyncStorage.multiRemove(photoKeys);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
}

export const photoService = new PhotoService();
