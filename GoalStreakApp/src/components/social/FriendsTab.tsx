import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';
import { Friend, FriendRequest } from '../../types/social';
import { SuggestedFriend } from '../../services/friendSuggestionsService';
import { useModeration } from '../../hooks/useModeration';
import * as ModerationFilter from '../../services/moderationFilter';
import FriendCard from './FriendCard';

interface FriendsTabProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  suggestedFriends?: SuggestedFriend[];
  onAcceptRequest: (requestId: string) => Promise<void>;
  onDeclineRequest: (requestId: string) => Promise<void>;
  onRemoveFriend: (friendId: string) => Promise<void>;
  onSendFriendRequest?: (email: string) => Promise<void>;
}

export default function FriendsTab({
  friends,
  pendingRequests,
  suggestedFriends = [],
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onSendFriendRequest,
}: FriendsTabProps) {
  // Moderation: hide friend requests from blocked users. Gate on `ready` so a
  // stale, unfiltered list is never shown before the block set has loaded.
  const { state: moderationState, ready: moderationReady } = useModeration();
  const visibleRequests = moderationReady
    ? ModerationFilter.filterFriendRequests(moderationState, pendingRequests)
    : [];

  return (
    <>
      {/* ── Friend Requests Section ── */}
      {visibleRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person-add" size={20} color={Colors.accent1} />
              <Text style={styles.sectionTitle}>Friend Requests</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{visibleRequests.length}</Text>
            </View>
          </View>

          {visibleRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestAvatar}>
                <Text style={styles.requestAvatarText}>
                  {(request.fromUserName || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName} numberOfLines={1}>
                  {request.fromUserName}
                </Text>
                <Text style={styles.requestEmail} numberOfLines={1}>
                  {request.fromUserEmail}
                </Text>
                {request.message && (
                  <Text style={styles.requestMessage} numberOfLines={2}>
                    "{request.message}"
                  </Text>
                )}
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => onAcceptRequest(request.id)}
                  accessibilityLabel="Accept friend request"
                  accessibilityRole="button"
                >
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => onDeclineRequest(request.id)}
                  accessibilityLabel="Decline friend request"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={18} color={Colors.secondaryText} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── My Friends Section ── */}
      <View style={styles.friendsSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="people" size={20} color={Colors.primaryText} />
            <Text style={styles.sectionTitle}>My Friends</Text>
          </View>
          <Text style={styles.friendCount}>{friends.length}</Text>
        </View>

        {friends.length > 0 ? (
          friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              type="friend"
              onRemove={() => onRemoveFriend(friend.friendId)}
            />
          ))
        ) : (
          <View style={styles.emptyFriends}>
            <Ionicons name="people-outline" size={40} color={Colors.gray.medium} />
            <Text style={styles.emptyFriendsText}>
              No friends yet. Search to find people you know!
            </Text>
          </View>
        )}
      </View>

      {/* ── Suggested Friends Section ── */}
      {suggestedFriends.length > 0 && (
        <View style={styles.suggestionsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles" size={20} color={Colors.accent1} />
              <Text style={styles.sectionTitle}>People You May Know</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {suggestedFriends.map((suggestion) => (
              <View key={suggestion.id} style={styles.suggestionCard}>
                <View style={styles.suggestionAvatar}>
                  {suggestion.photoURL ? (
                    <Image
                      source={{ uri: suggestion.photoURL }}
                      style={styles.suggestionAvatarImage}
                    />
                  ) : (
                    <Text style={styles.suggestionAvatarText}>
                      {suggestion.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.suggestionName} numberOfLines={1}>
                  {suggestion.name}
                </Text>
                <Text style={styles.suggestionReason} numberOfLines={2}>
                  {suggestion.matchReason}
                </Text>
                <TouchableOpacity
                  style={styles.addFriendButton}
                  onPress={() => onSendFriendRequest?.(suggestion.email)}
                  accessibilityLabel={`Add ${suggestion.name} as friend`}
                  accessibilityRole="button"
                >
                  <Ionicons name="person-add-outline" size={16} color={Colors.white} />
                  <Text style={styles.addFriendButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // ── Section Layout ──
  requestsSection: {
    marginBottom: 8,                    // 8 × 1 (tight gap before next section)
  },
  friendsSection: {
    marginBottom: 8,                    // 8 × 1
  },
  suggestionsSection: {
    marginBottom: 24,                   // 8 × 3 (comfortable)
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,               // 8 × 2 (base)
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                            // 8 × 1 (tight)
  },
  sectionTitle: {
    fontSize: 20,                      // subheading
    fontWeight: '600',                 // semibold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
  },

  // ── Badge ──
  badge: {
    backgroundColor: Colors.accent1,
    borderRadius: 12,                  // pill
    minWidth: 24,                      // 8 × 3
    height: 24,                        // 8 × 3
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,              // 8 × 1 (tight)
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,                      // small
    fontWeight: '700',                 // bold
    fontFamily: Typography.fontFamily.bold,
  },
  friendCount: {
    fontSize: 16,                      // body
    fontWeight: '600',                 // semibold
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.semibold,
  },

  // ── Request Cards ──
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,                       // 8 × 2 (base)
    marginBottom: 8,                   // 8 × 1 (tight)
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  requestAvatar: {
    width: 48,                         // 8 × 6
    height: 48,                        // 8 × 6
    borderRadius: 24,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,                   // 8 × 2 (base)
  },
  requestAvatarText: {
    color: Colors.white,
    fontSize: 20,                      // subheading
    fontWeight: '700',                 // bold
    fontFamily: Typography.fontFamily.bold,
  },
  requestInfo: {
    flex: 1,
    marginRight: 8,                    // 8 × 1 (tight)
  },
  requestName: {
    fontSize: 16,                      // body
    fontWeight: '600',                 // semibold
    color: Colors.primaryText,
    marginBottom: 2,
    fontFamily: Typography.fontFamily.semibold,
  },
  requestEmail: {
    fontSize: 14,                      // caption
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
  },
  requestMessage: {
    fontSize: 14,                      // caption
    color: Colors.secondaryText,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 20,
    fontFamily: Typography.fontFamily.regular,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                            // 8 × 1 (tight)
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent3,
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 10,               // comfortable tap
    borderRadius: 24,                  // pill
    minHeight: 40,                     // 8 × 5
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: 14,                      // caption
    fontWeight: '600',                 // semibold
    fontFamily: Typography.fontFamily.semibold,
  },
  declineButton: {
    width: 40,                         // 8 × 5
    height: 40,                        // 8 × 5
    borderRadius: 20,
    backgroundColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Empty Friends ──
  emptyFriends: {
    alignItems: 'center',
    paddingVertical: 32,               // 8 × 4 (loose)
    paddingHorizontal: 24,             // 8 × 3 (comfortable)
    backgroundColor: Colors.white,
    borderRadius: 16,
    gap: 8,                            // 8 × 1 (tight)
  },
  emptyFriendsText: {
    fontSize: 16,                      // body
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,                    // 1.5 line height
    fontFamily: Typography.fontFamily.regular,
  },

  // ── Suggestions ──
  suggestionsScroll: {
    paddingRight: 16,                  // 8 × 2 (base) trailing space
  },
  suggestionCard: {
    width: 152,                        // 8 × 19 (compact card)
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,                       // 8 × 2 (base)
    marginRight: 12,                   // 8 × 1.5
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionAvatar: {
    width: 56,                         // 8 × 7
    height: 56,                        // 8 × 7
    borderRadius: 28,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,                   // 8 × 1 (tight)
    overflow: 'hidden',
  },
  suggestionAvatarImage: {
    width: 56,                         // 8 × 7
    height: 56,                        // 8 × 7
    borderRadius: 28,
  },
  suggestionAvatarText: {
    color: Colors.white,
    fontSize: 24,                      // heading
    fontWeight: '700',                 // bold
    fontFamily: Typography.fontFamily.bold,
  },
  suggestionName: {
    fontSize: 14,                      // caption
    fontWeight: '600',                 // semibold
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: Typography.fontFamily.semibold,
  },
  suggestionReason: {
    fontSize: 12,                      // small
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,                  // 8 × 1.5
    minHeight: 32,                     // 2 lines
    fontFamily: Typography.fontFamily.regular,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.accent1,
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 8,                // 8 × 1 (tight)
    borderRadius: 16,                  // pill
    minHeight: 36,                     // compact but tappable
    width: '100%',
  },
  addFriendButtonText: {
    color: Colors.white,
    fontSize: 14,                      // caption
    fontWeight: '600',                 // semibold
    fontFamily: Typography.fontFamily.semibold,
  },
});
