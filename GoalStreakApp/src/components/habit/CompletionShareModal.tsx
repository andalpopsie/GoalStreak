// CompletionShareModal — Optional photo + caption after completing a habit
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography } from '../../constants/theme';

interface CompletionShareModalProps {
  visible: boolean;
  habitName: string;
  isPublic: boolean;
  onShare: (photoUri?: string, caption?: string) => Promise<void>;
  onSkip: () => void;
}

export default function CompletionShareModal({
  visible,
  habitName,
  isPublic,
  onShare,
  onSkip,
}: CompletionShareModalProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare(
        photoUri || undefined,
        caption.trim() || undefined,
      );
      reset();
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSkip = () => {
    reset();
    onSkip();
  };

  const reset = () => {
    setPhotoUri(null);
    setCaption('');
  };

  const hasContent = !!photoUri || !!caption.trim();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleSkip} />

        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.accent3} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Nice work! 🎉</Text>
              <View style={styles.headerSubRow}>
                <Text style={styles.headerSubtitle}>
                  You completed "{habitName}"
                </Text>
                <View style={styles.visibilityBadge}>
                  <Ionicons
                    name={isPublic ? 'people-outline' : 'lock-closed-outline'}
                    size={12}
                    color={Colors.secondaryText}
                  />
                  <Text style={styles.visibilityText}>
                    {isPublic ? 'Friends' : 'Private'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Photo Section */}
          {photoUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.photoImage} resizeMode="cover" />
              <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotoUri(null)}>
                <Ionicons name="close-circle" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Ionicons name="camera-outline" size={22} color={Colors.accent1} />
                <Text style={styles.photoButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
                <Ionicons name="images-outline" size={22} color={Colors.accent1} />
                <Text style={styles.photoButtonText}>Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Caption */}
          <TextInput
            style={styles.captionInput}
            placeholder="Add a note about your progress..."
            placeholderTextColor={Colors.secondaryText}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>{isPublic ? 'Skip' : 'Done'}</Text>
            </TouchableOpacity>
            {isPublic && (
              <TouchableOpacity
                style={[styles.shareButton, !hasContent && styles.shareButtonDisabled]}
                onPress={handleShare}
                disabled={!hasContent || isSharing}
              >
                <Ionicons name="paper-plane" size={18} color={Colors.white} />
                <Text style={styles.shareText}>
                  {isSharing ? 'Sharing...' : 'Share with Friends'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Private habit note */}
          {!isPublic && hasContent && (
            <Text style={styles.privateNote}>
              This habit is private. Photos and notes are saved for your eyes only.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,           // 8 × 2 (base)
    paddingBottom: 40,               // safe area
  },
  handleBar: {
    width: 40,                       // 8 × 5
    height: 4,
    backgroundColor: Colors.gray.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,                   // 8 × 1.5
    marginBottom: 16,                // 8 × 2 (base)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,                // 8 × 2 (base)
  },
  headerIcon: {
    width: 48,                       // 8 × 6
    height: 48,                      // 8 × 6
    borderRadius: 24,
    backgroundColor: Colors.accent3 + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,                 // 8 × 1.5
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,                    // large body
    fontWeight: '700',               // bold
    color: Colors.primaryText,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,                    // caption
    color: Colors.secondaryText,
    marginTop: 2,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,                          // 8 × 1 (tight)
    flexWrap: 'wrap',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.gray.light,
    paddingHorizontal: 8,            // 8 × 1 (tight)
    paddingVertical: 2,
    borderRadius: 8,
  },
  visibilityText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,                    // small
    color: Colors.secondaryText,
    fontWeight: '500',               // medium
  },
  // Photo
  photoButtons: {
    flexDirection: 'row',
    gap: 12,                         // 8 × 1.5
    marginBottom: 12,                // 8 × 1.5
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,                          // 8 × 1 (tight)
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.accent1 + '10',
    borderWidth: 1,
    borderColor: Colors.accent1 + '30',
    minHeight: 48,                   // 8 × 6 (touch target)
  },
  photoButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,                    // caption
    fontWeight: '600',               // semibold
    color: Colors.accent1,
  },
  photoPreview: {
    position: 'relative',
    marginBottom: 12,                // 8 × 1.5
  },
  photoImage: {
    width: '100%',
    height: 200,                     // 8 × 25
    borderRadius: 12,
    backgroundColor: Colors.gray.light,
  },
  photoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  // Caption
  captionInput: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 15,                    // body-ish
    color: Colors.primaryText,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,                     // 8 × 1.5
    minHeight: 64,                   // 8 × 8
    maxHeight: 100,
    marginBottom: 16,                // 8 × 2 (base)
    lineHeight: 22,
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,                         // 8 × 1.5
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,           // 8 × 3 (comfortable)
    borderRadius: 24,                // pill
    backgroundColor: Colors.gray.light,
    minHeight: 48,                   // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 16,                    // body
    fontWeight: '500',               // medium
    color: Colors.secondaryText,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,                          // 8 × 1 (tight)
    paddingVertical: 14,
    borderRadius: 24,                // pill
    backgroundColor: Colors.accent1,
    minHeight: 48,                   // 8 × 6 (touch target)
  },
  shareButtonDisabled: {
    backgroundColor: Colors.gray.medium,
  },
  shareText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,                    // body
    fontWeight: '600',               // semibold
    color: Colors.white,
  },
  privateNote: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,                    // small
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: 8,                    // 8 × 1 (tight)
    fontStyle: 'italic',
  },
});
