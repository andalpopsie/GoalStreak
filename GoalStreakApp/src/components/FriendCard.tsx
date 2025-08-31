// FriendCard Component - Feed-style layout with profile photos
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants/theme';
import { Friend, FriendRequest } from '../types/social';

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
        <Text style={styles.initials}>
          {getInitials(getName())}
        </Text>
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initials: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#22C55E',
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
});
