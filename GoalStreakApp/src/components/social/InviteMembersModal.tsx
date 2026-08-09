// InviteMembersModal Component - Modal for inviting friends to a group
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Typography } from '../../constants/theme';
import { Friend } from '../../types/social';
import groupService from '../../services/groupService';

interface InviteMembersModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  onInvite: (friendId: string, friendName: string) => Promise<void>;
  memberCount: number;
}

const MAX_MEMBERS = 10;

export default function InviteMembersModal({
  visible,
  onClose,
  groupId,
  onInvite,
  memberCount,
}: InviteMembersModalProps) {
  const [invitableFriends, setInvitableFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const isFull = memberCount >= MAX_MEMBERS;

  useEffect(() => {
    if (visible && groupId) {
      loadInvitableFriends();
    }
  }, [visible, groupId]);

  const loadInvitableFriends = async () => {
    setIsLoading(true);
    try {
      // getGroupInvitableFriends needs adminId, but the service gets it from the group
      // We pass groupId and the service handles the rest
      const friends = await groupService.getGroupInvitableFriends(groupId, '');
      setInvitableFriends(friends);
    } catch (error) {
      console.error('Error loading invitable friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = useCallback(
    async (friend: Friend) => {
      if (isFull || sendingTo) return;

      setSendingTo(friend.friendId);
      try {
        await onInvite(friend.friendId, friend.friendName);
        // Remove from list after successful invite
        setInvitableFriends((prev) => prev.filter((f) => f.friendId !== friend.friendId));
        Alert.alert('Invited!', `${friend.friendName} has been invited to the group.`);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to send invitation');
      } finally {
        setSendingTo(null);
      }
    },
    [isFull, sendingTo, onInvite]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close invite members modal"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite Members</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Member Count */}
        <View style={styles.countBar}>
          <Ionicons name="people-outline" size={16} color={Colors.primaryText} />
          <Text style={styles.countText}>
            {memberCount}/{MAX_MEMBERS} members
          </Text>
          {isFull && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullBadgeText}>Full</Text>
            </View>
          )}
        </View>

        {/* Full Group Message */}
        {isFull && (
          <View style={styles.fullMessage}>
            <Ionicons name="information-circle" size={20} color={Colors.secondaryText} />
            <Text style={styles.fullMessageText}>
              This group is full. Remove a member to invite someone new.
            </Text>
          </View>
        )}

        {/* Friends List */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.accent1} />
              <Text style={styles.loadingText}>Loading friends...</Text>
            </View>
          ) : invitableFriends.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.gray.medium} />
              <Text style={styles.emptyText}>
                No friends available to invite. All your friends are already in this group or have pending invitations.
              </Text>
            </View>
          ) : (
            invitableFriends.map((friend) => (
              <View key={friend.friendId} style={styles.friendRow}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>
                    {(friend.friendName || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName} numberOfLines={1}>
                    {friend.friendName}
                  </Text>
                  <Text style={styles.friendEmail} numberOfLines={1}>
                    {friend.friendEmail}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.inviteButton, isFull && styles.inviteButtonDisabled]}
                  onPress={() => handleInvite(friend)}
                  disabled={isFull || sendingTo === friend.friendId}
                  accessibilityLabel={`Invite ${friend.friendName}`}
                  accessibilityRole="button"
                >
                  {sendingTo === friend.friendId ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="person-add-outline" size={16} color={Colors.white} />
                      <Text style={styles.inviteButtonText}>Invite</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 16,               // 8 × 2 (base)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
    backgroundColor: Colors.white,
  },
  closeButton: {
    width: 48,                          // 8 × 6 (touch target)
    height: 48,                         // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
  },
  headerSpacer: {
    width: 48,
  },
  countBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                             // 8 × 1 (tight)
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 16,               // 8 × 2 (base)
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  countText: {
    fontSize: 14,                       // caption
    fontWeight: '500',                  // medium
    color: Colors.primaryText,
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
  },
  fullBadge: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingHorizontal: 8,              // 8 × 1 (tight)
    paddingVertical: 4,
  },
  fullBadgeText: {
    fontSize: 12,                       // small
    fontWeight: '600',                  // semibold
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  fullMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                             // 8 × 1 (tight)
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 16,               // 8 × 2 (base)
    backgroundColor: '#FFF4F4',
  },
  fullMessageText: {
    flex: 1,
    fontSize: 14,                       // caption
    color: Colors.secondaryText,
    lineHeight: 20,
    fontFamily: Typography.fontFamily.regular,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,                        // 8 × 2 (base)
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 48,               // 8 × 6 (spacious)
    gap: 16,                            // 8 × 2 (base)
  },
  loadingText: {
    fontSize: 16,                       // body
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,               // 8 × 6 (spacious)
    paddingHorizontal: 24,             // 8 × 3 (comfortable)
    gap: 16,                            // 8 × 2 (base)
  },
  emptyText: {
    fontSize: 16,                       // body
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,                     // 1.5 line height
    fontFamily: Typography.fontFamily.regular,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,                        // 8 × 2 (base)
    marginBottom: 8,                    // 8 × 1 (tight)
    minHeight: 56,                      // 8 × 7
    ...Shadows.sm,
  },
  friendAvatar: {
    width: 40,                          // 8 × 5
    height: 40,                         // 8 × 5
    borderRadius: 20,
    backgroundColor: Colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,                    // 8 × 2 (base)
  },
  friendAvatarText: {
    color: Colors.white,
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    fontFamily: Typography.fontFamily.semibold,
  },
  friendInfo: {
    flex: 1,
    marginRight: 16,                    // 8 × 2 (base)
  },
  friendName: {
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 2,
    fontFamily: Typography.fontFamily.semibold,
  },
  friendEmail: {
    fontSize: 14,                       // caption
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent1,   // Purple
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 10,
    borderRadius: 24,                   // Pill
    minHeight: 40,                      // 8 × 5
    minWidth: 48,                       // 8 × 6 (touch target)
  },
  inviteButtonDisabled: {
    opacity: 0.5,
  },
  inviteButtonText: {
    color: Colors.white,
    fontSize: 14,                       // caption
    fontWeight: '600',                  // semibold
    fontFamily: Typography.fontFamily.semibold,
  },
});
