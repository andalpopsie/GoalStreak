import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';
import { Friend, FriendRequest } from '../../types/social';
import FriendCard from './FriendCard';

interface FriendsTabProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  onAcceptRequest: (requestId: string) => Promise<void>;
  onDeclineRequest: (requestId: string) => Promise<void>;
  onRemoveFriend: (friendId: string) => Promise<void>;
}

export default function FriendsTab({
  friends,
  pendingRequests,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
}: FriendsTabProps) {
  return (
    <>
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
    ...Typography.h4,
    color: Colors.primaryText,
    marginBottom: 12,
    marginTop: 8,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border + '30',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  requestEmail: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  requestMessage: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontStyle: 'italic',
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  requestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.accent3,
  },
  declineButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  declineButtonText: {
    color: Colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
});
