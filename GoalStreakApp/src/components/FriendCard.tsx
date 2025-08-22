// FriendCard Component - Display friend information
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
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
    if (friend) return friend.friendName;
    if (friendRequest) {
      return type === 'pending' ? friendRequest.fromUserName : friendRequest.toUserEmail;
    }
    return 'Unknown';
  };

  const getEmail = () => {
    if (friend) return friend.friendEmail;
    if (friendRequest) {
      return type === 'pending' ? friendRequest.fromUserEmail : friendRequest.toUserEmail;
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
    if (isLoading) {
      return (
        <View style={styles.actionsContainer}>
          <View style={styles.loadingButton}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      );
    }

    switch (type) {
      case 'pending':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]} 
              onPress={onAccept}
            >
              <Ionicons name="checkmark" size={16} color={Colors.white} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.declineButton]} 
              onPress={onDecline}
            >
              <Ionicons name="close" size={16} color={Colors.gray.dark} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        );

      case 'sent':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.statusContainer}>
              <Ionicons name="time-outline" size={14} color={Colors.gray.medium} />
              <Text style={styles.statusText}>Pending</Text>
            </View>
          </View>
        );

      case 'friend':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.removeButton]} 
              onPress={onRemove}
            >
              <Ionicons name="person-remove-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.accent3} />
              <Text style={styles.friendStatusText}>Friends</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(getName())}</Text>
        </View>
        {type === 'friend' && (
          <View style={styles.onlineIndicator} />
        )}
      </View>

      {/* Friend Info */}
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

      {/* Actions */}
      {renderActions()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent3,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  infoContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: 2,
  },
  email: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 4,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.medium,
    fontStyle: 'italic',
    fontFamily: Typography.fontFamily.regular,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: Colors.accent3,
  },
  acceptButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  declineButton: {
    backgroundColor: Colors.gray.light,
    borderWidth: 1,
    borderColor: Colors.gray.medium,
  },
  declineButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.medium,
  },
  cancelButton: {
    backgroundColor: Colors.gray.light,
    paddingHorizontal: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.medium,
  },
  removeButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray.medium,
    fontFamily: Typography.fontFamily.regular,
  },
  friendStatusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.accent3,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
  },
  loadingButton: {
    backgroundColor: Colors.gray.light,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.medium,
    fontFamily: Typography.fontFamily.regular,
  },
});
