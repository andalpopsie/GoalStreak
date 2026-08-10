import React, { useState } from 'react';
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

// The three switchable segments. "Your Friends" is the default landing view.
type Segment = 'friends' | 'requests' | 'suggestions';

/** Compact relative time ("just now", "3h ago", "1d ago") from a Date/Timestamp. */
function timeAgo(value: Date | { toDate?: () => Date } | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : value.toDate?.();
  if (!date) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function initial(name?: string): string {
  return (name || '?').charAt(0).toUpperCase();
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
  const [segment, setSegment] = useState<Segment>('friends');

  // Moderation: hide friend requests from blocked users. Gate on `ready` so a
  // stale, unfiltered list is never shown before the block set has loaded.
  const { state: moderationState, ready: moderationReady } = useModeration();
  const visibleRequests = moderationReady
    ? ModerationFilter.filterFriendRequests(moderationState, pendingRequests)
    : [];

  const segments: { key: Segment; label: string; count: number }[] = [
    { key: 'friends', label: 'Your Friends', count: friends.length },
    { key: 'requests', label: 'Requests', count: visibleRequests.length },
    { key: 'suggestions', label: 'Suggestions', count: suggestedFriends.length },
  ];

  const activeTitle =
    segment === 'friends' ? 'Your Friends' : segment === 'requests' ? 'Friend Requests' : 'Suggestions';
  const activeCount =
    segment === 'friends' ? friends.length : segment === 'requests' ? visibleRequests.length : suggestedFriends.length;

  return (
    <>
      {/* ── Segmented switcher ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentBar}
      >
        {segments.map(({ key, label, count }) => {
          const active = segment === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.segmentPill, active && styles.segmentPillActive]}
              onPress={() => setSegment(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label}, ${count}`}
              testID={`friends-segment-${key}`}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {label}
                {count > 0 ? `  ${count}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Active section header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{activeTitle}</Text>
        {activeCount > 0 && <Text style={styles.sectionCount}>{activeCount}</Text>}
      </View>

      {/* ── Your Friends ── */}
      {segment === 'friends' &&
        (friends.length > 0 ? (
          friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              type="friend"
              onRemove={() => onRemoveFriend(friend.friendId)}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={Colors.gray.medium} />
            <Text style={styles.emptyText}>No friends yet. Check Suggestions to find people you know!</Text>
          </View>
        ))}

      {/* ── Requests ── */}
      {segment === 'requests' &&
        (visibleRequests.length > 0 ? (
          visibleRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial(request.fromUserName)}</Text>
              </View>
              <View style={styles.requestBody}>
                <Text style={styles.name} numberOfLines={1}>{request.fromUserName}</Text>
                <Text style={styles.subtext} numberOfLines={1}>
                  {[timeAgo(request.createdAt), request.fromUserEmail].filter(Boolean).join(' · ')}
                </Text>
                {request.message ? (
                  <Text style={styles.message} numberOfLines={2}>"{request.message}"</Text>
                ) : null}
                <View style={styles.requestButtons}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDeclineRequest(request.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete friend request from ${request.fromUserName}`}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => onAcceptRequest(request.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Confirm friend request from ${request.fromUserName}`}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="person-add-outline" size={40} color={Colors.gray.medium} />
            <Text style={styles.emptyText}>No pending friend requests.</Text>
          </View>
        ))}

      {/* ── Suggestions (vertical list) ── */}
      {segment === 'suggestions' &&
        (suggestedFriends.length > 0 ? (
          suggestedFriends.map((suggestion) => (
            <View key={suggestion.id} style={styles.suggestRow}>
              <View style={styles.avatar}>
                {suggestion.photoURL ? (
                  <Image source={{ uri: suggestion.photoURL }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initial(suggestion.name)}</Text>
                )}
              </View>
              <View style={styles.suggestBody}>
                <Text style={styles.name} numberOfLines={1}>{suggestion.name}</Text>
                <Text style={styles.subtext} numberOfLines={2}>{suggestion.matchReason}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => onSendFriendRequest?.(suggestion.email)}
                accessibilityRole="button"
                accessibilityLabel={`Add ${suggestion.name} as friend`}
              >
                <Ionicons name="person-add" size={16} color={Colors.white} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={40} color={Colors.gray.medium} />
            <Text style={styles.emptyText}>No suggestions right now. Check back later!</Text>
          </View>
        ))}
    </>
  );
}

const styles = StyleSheet.create({
  // ── Segmented switcher ──
  segmentBar: {
    flexDirection: 'row',
    gap: 8,                            // 8 × 1 (tight)
    paddingVertical: 12,               // comfortable
    paddingRight: 16,                  // trailing space when scrolled
  },
  segmentPill: {
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 8,                // 8 × 1 (tight)
    borderRadius: 20,                  // pill
    borderWidth: 1,
    borderColor: Colors.gray.light,
    backgroundColor: Colors.white,
    minHeight: 40,                     // 8 × 5 (touch target)
    justifyContent: 'center',
  },
  segmentPillActive: {
    backgroundColor: Colors.accent1,
    borderColor: Colors.accent1,
  },
  segmentText: {
    fontSize: 14,                      // caption
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.medium,
  },
  segmentTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,                // 8 × 1 (tight)
  },
  sectionTitle: {
    fontSize: 20,                      // subheading
    fontWeight: '600',                 // semibold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
  },
  sectionCount: {
    fontSize: 16,                      // body
    fontWeight: '600',                 // semibold
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.semibold,
  },

  // ── Shared avatar ──
  avatar: {
    width: 56,                         // 8 × 7
    height: 56,                        // 8 × 7
    borderRadius: 28,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,                         // 8 × 7
    height: 56,                        // 8 × 7
    borderRadius: 28,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 20,                      // subheading
    fontWeight: '700',                 // bold
    fontFamily: Typography.fontFamily.bold,
  },

  // ── Shared text ──
  name: {
    fontSize: 16,                      // body
    fontWeight: '600',                 // semibold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
  },
  subtext: {
    fontSize: 14,                      // caption
    color: Colors.secondaryText,
    marginTop: 2,
    fontFamily: Typography.fontFamily.regular,
  },
  message: {
    fontSize: 14,                      // caption
    color: Colors.secondaryText,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 20,
    fontFamily: Typography.fontFamily.regular,
  },

  // ── Request card (avatar + body with buttons underneath) ──
  requestCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,                       // 8 × 2 (base)
    marginBottom: 8,                   // 8 × 1 (tight)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  requestBody: {
    flex: 1,
    marginLeft: 16,                    // 8 × 2 (base)
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 12,                           // 8 × 1.5
    marginTop: 12,                     // 8 × 1.5
  },
  deleteButton: {
    flex: 1,
    minHeight: 40,                     // 8 × 5 (touch target)
    borderRadius: 20,                  // pill
    borderWidth: 1,
    borderColor: Colors.gray.medium,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,                      // caption
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
  },
  confirmButton: {
    flex: 1,
    minHeight: 40,                     // 8 × 5 (touch target)
    borderRadius: 20,                  // pill
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14,                      // caption
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },

  // ── Suggestion row (avatar + body + Add) ──
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,                       // 8 × 2 (base)
    marginBottom: 8,                   // 8 × 1 (tight)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestBody: {
    flex: 1,
    marginLeft: 16,                    // 8 × 2 (base)
    marginRight: 12,                   // 8 × 1.5
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.accent1,
    paddingHorizontal: 16,             // 8 × 2 (base)
    minHeight: 40,                     // 8 × 5 (touch target)
    borderRadius: 20,                  // pill
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 14,                      // caption
    fontFamily: Typography.fontFamily.semibold,
  },

  // ── Empty state ──
  empty: {
    alignItems: 'center',
    paddingVertical: 32,               // 8 × 4 (loose)
    paddingHorizontal: 24,             // 8 × 3 (comfortable)
    backgroundColor: Colors.white,
    borderRadius: 16,
    gap: 8,                            // 8 × 1 (tight)
  },
  emptyText: {
    fontSize: 16,                      // body
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,                    // 1.5 line height
    fontFamily: Typography.fontFamily.regular,
  },
});
