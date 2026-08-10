// FriendCard Component - Feed-style layout with profile photos
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';
import { Friend, FriendRequest } from '../../types/social';
import { photoService } from '../../services/photoService';

interface FriendCardProps {
  friend?: Friend;
  friendRequest?: FriendRequest;
  type: 'friend' | 'pending' | 'sent';
  onAccept?: () => void;
  onDecline?: () => void;
  onRemove?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function FriendCard({
  friend,
  friendRequest,
  type,
  onAccept,
  onDecline,
  onRemove,
  onCancel,
  isLoading = false
}: FriendCardProps) {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Load profile photo when component mounts
  useEffect(() => {
    loadProfilePhoto();
  }, [friend, friendRequest]);

  const loadProfilePhoto = async () => {
    try {
      const userId = friend?.friendId || friendRequest?.fromUserId;
      
      if (userId) {
        // Use the new photoService
        const photoUri = await photoService.getProfilePhoto(userId);
        if (photoUri) {
          setProfilePhoto(photoUri);
        }
      }
    } catch (error) {
      console.error('Error loading friend profile photo:', error);
    }
  };

  const getName = () => {
    if (friend) return friend.friendName || 'Unknown User';
    if (friendRequest) {
      return type === 'pending' 
        ? (friendRequest.fromUserName || 'Unknown User')
        : (friendRequest.toUserEmail || 'Unknown User');
    }
    return 'Unknown User';
  };

  const getEmail = () => {
    if (friend) return friend.friendEmail || '';
    if (friendRequest) {
      return type === 'pending' 
        ? (friendRequest.fromUserEmail || '')
        : (friendRequest.toUserEmail || '');
    }
    return '';
  };

  const getPhotoURL = () => {
    // First try the loaded profile photo from AsyncStorage
    if (profilePhoto) return profilePhoto;
    
    // Then try the original sources
    if (friend) return friend.friendPhotoURL || null;
    if (friendRequest) {
      return type === 'pending' 
        ? (friendRequest.fromUserPhotoURL || null)
        : null;
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderActions = () => {
    switch (type) {
      case 'pending':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.iconButton, styles.acceptButton]} 
              onPress={onAccept}
              disabled={isLoading}
            >
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconButton, styles.declineButton]} 
              onPress={onDecline}
              disabled={isLoading}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        );

      case 'sent':
        return (
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onCancel}
            disabled={isLoading}
          >
            <Ionicons name="close" size={24} color={Colors.error} />
          </TouchableOpacity>
        );

      case 'friend':
        return (
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onRemove}
            disabled={isLoading}
          >
            <Ionicons name="close" size={24} color={Colors.error} />
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile Photo */}
      <View style={styles.profilePhoto}>
        {getPhotoURL() ? (
          <Image 
            source={{ uri: getPhotoURL()! }} 
            style={styles.profileImage}
          />
        ) : (
          <Text style={styles.initials}>
            {getInitials(getName())}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {getName()}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {getEmail()}
          </Text>
          {friendRequest?.message && (
            <Text style={styles.message} numberOfLines={2}>
              "{friendRequest.message}"
            </Text>
          )}
        </View>
        {renderActions()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,                // 8 * 1.5
    paddingHorizontal: 16,              // 8 * 2 (base)
    backgroundColor: Colors.white,
    borderRadius: 16,                   // Modern rounded
    marginBottom: 8,                    // 8 * 1 (tight)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  profilePhoto: {
    width: 48,                          // 8 * 6 (larger)
    height: 48,                         // 8 * 6 (larger)
    borderRadius: 24,
    backgroundColor: Colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,                    // 8 * 2 (base)
    overflow: 'hidden',
  },
  profileImage: {
    width: 48,                          // 8 * 6
    height: 48,                         // 8 * 6
    borderRadius: 24,
  },
  initials: {
    color: Colors.white,
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    fontFamily: Typography.fontFamily.semibold,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,                    // 8 * 2 (base)
  },
  name: {
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 4,                    // 8 * 0.5 (extra tight)
    fontFamily: Typography.fontFamily.semibold,
  },
  email: {
    fontSize: 14,                       // small
    color: Colors.secondaryText,
    marginBottom: 4,                    // 8 * 0.5 (extra tight)
    fontFamily: Typography.fontFamily.regular,
  },
  message: {
    fontSize: 14,                       // small
    color: Colors.accent2,
    fontStyle: 'italic',
    lineHeight: 20,                     // Comfortable reading
    fontFamily: Typography.fontFamily.regular,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,                             // 8 * 1 (tight)
  },
  iconButton: {
    width: 48,                          // 8 * 6 (touch target)
    height: 48,                         // 8 * 6 (touch target)
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray.light,
  },
  acceptButton: {
    backgroundColor: '#22C55E',
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
});
