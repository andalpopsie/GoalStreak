import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';
import { Friend, FriendRequest } from '../../types/social';
import { SuggestedFriend } from '../../services/friendSuggestionsService';
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
  return (
    <>
      {/* Suggested Friends Section */}
      {suggestedFriends.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            <Ionicons name="sparkles" size={20} color={Colors.accent1} /> Suggested Friends
          </Text>
          {suggestedFriends.map((suggestion) => (
            <View key={suggestion.id} style={styles.suggestionCard}>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName}>{suggestion.name}</Text>
                <Text style={styles.suggestionReason}>{suggestion.matchReason}</Text>
                {suggestion.sharedCategories.length > 0 && (
                  <View style={styles.categoriesContainer}>
                    {suggestion.sharedCategories.slice(0, 3).map((cat, idx) => (
                      <View key={idx} style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => onSendFriendRequest?.(suggestion.email)}
              >
                <Ionicons name="person-add" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Friend Requests ({pendingRequests.length})</Text>
          {pendingRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{request.fromUserName}</Text>
                <Text style={styles.requestEmail}>{request.fromUserEmail}</Text>
                {request.message && (
                  <Text style={styles.requestMessage}>"{request.message}"</Text>
                )}
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.requestButton, styles.acceptButton]}
                  onPress={() => onAcceptRequest(request.id)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.requestButton, styles.declineButton]}
                  onPress={() => onDeclineRequest(request.id)}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Friends List */}
      {friends.length > 0 && (
        <>
          {pendingRequests.length > 0 && (
            <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
          )}
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              type="friend"
              onRemove={() => onRemoveFriend(friend.friendId)}
            />
          ))}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 16,                   // 8 * 2 (base)
    marginTop: 16,                      // 8 * 2 (base)
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,                // 8 * 2 (base)
    paddingHorizontal: 16,              // 8 * 2 (base)
    marginBottom: 16,                   // 8 * 2 (base)
    backgroundColor: Colors.white,
    borderRadius: 16,                   // Modern rounded
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requestInfo: {
    flex: 1,
    marginRight: 16,                    // 8 * 2 (base)
  },
  requestName: {
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 4,                    // 8 * 0.5 (extra tight)
  },
  requestEmail: {
    fontSize: 14,                       // small
    color: Colors.secondaryText,
    marginBottom: 4,                    // 8 * 0.5 (extra tight)
  },
  requestMessage: {
    fontSize: 14,                       // small
    color: Colors.secondaryText,
    fontStyle: 'italic',
    marginTop: 8,                       // 8 * 1 (tight)
    lineHeight: 20,                     // Comfortable reading
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,                             // 8 * 1 (tight)
  },
  requestButton: {
    paddingHorizontal: 20,              // 8 * 2.5
    paddingVertical: 12,                // 8 * 1.5
    borderRadius: 24,                   // Pill-shaped
    minWidth: 80,                       // 8 * 10
    minHeight: 48,                      // 8 * 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.accent3,
  },
  declineButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray.light,
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: 14,                       // small
    fontWeight: '600',                  // semibold
  },
  declineButtonText: {
    color: Colors.secondaryText,
    fontSize: 14,                       // small
    fontWeight: '600',                  // semibold
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,                // 8 * 2 (base)
    paddingHorizontal: 16,              // 8 * 2 (base)
    marginBottom: 12,                   // 8 * 1.5
    backgroundColor: Colors.white,
    borderRadius: 16,                   // Modern rounded
    borderWidth: 1,
    borderColor: Colors.accent1 + '20', // Subtle accent border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionInfo: {
    flex: 1,
    marginRight: 16,                    // 8 * 2 (base)
  },
  suggestionName: {
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 4,                    // 8 * 0.5 (extra tight)
  },
  suggestionReason: {
    fontSize: 13,                       // small
    color: Colors.accent1,
    marginBottom: 8,                    // 8 * 1 (tight)
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,                             // 8 * 0.75
  },
  categoryBadge: {
    backgroundColor: Colors.accent3 + '20',
    paddingHorizontal: 10,              // 8 * 1.25
    paddingVertical: 4,                 // 8 * 0.5
    borderRadius: 12,                   // Pill-shaped
  },
  categoryText: {
    fontSize: 12,                       // caption
    color: Colors.accent3,
    fontWeight: '500',                  // medium
  },
  addButton: {
    width: 48,                          // 8 * 6 (touch target)
    height: 48,                         // 8 * 6 (touch target)
    borderRadius: 24,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
