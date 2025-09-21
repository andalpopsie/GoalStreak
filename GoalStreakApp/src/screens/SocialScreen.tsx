import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants/theme';
import { useFriends } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { ReactionType, UserSearchResult } from '../types/social';
import { SearchModal } from '../components/common';
import { ActivityFeedTab, FriendsTab } from '../components/social';

type TabType = 'feed' | 'friends';

export default function SocialScreen() {
  const { user } = useAuth();
  
  const {
    friends,
    pendingRequests,
    activityFeed,
    isLoadingFriends,
    isLoadingActivity,
    isSendingRequest,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refreshFriends,
    refreshActivityFeed,
    addReaction,
  } = useFriends();

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

  // Auto-load feed data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'feed') {
      refreshActivityFeed();
    } else {
      refreshFriends();
    }
  }, [activeTab, refreshActivityFeed, refreshFriends]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (activeTab === 'feed') {
      refreshActivityFeed();
    } else {
      refreshFriends();
    }
  }, [activeTab, refreshActivityFeed, refreshFriends]);

  // Handle reaction
  const handleReaction = useCallback(async (activityId: string, reactionType: ReactionType) => {
    if (!user?.id) return;
    await addReaction(activityId, reactionType);
  }, [user?.id, addReaction]);

  const handleSendFriendRequest = async (email: string, message: string) => {
    if (!user?.id) return;
    
    try {
      await sendFriendRequest(email, message);
      Alert.alert('Success', 'Friend request sent successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  // Send friend request from search
  const handleSendFriendRequestFromSearch = async (toUser: UserSearchResult) => {
    if (!user?.id || !toUser.email) return;

    setSendingRequestTo(toUser.id);
    try {
      await sendFriendRequest(
        toUser.email, 
        `Hi ${toUser.name || 'there'}! I'd like to connect with you on GoalStreak.`
      );
      Alert.alert('Success', 'Friend request sent successfully!');
    } catch (error: any) {
      if (error.message?.includes('already sent')) {
        Alert.alert('Info', 'Friend request already sent to this user.');
      } else {
        Alert.alert('Error', error.message || 'Failed to send friend request');
      }
    } finally {
      setSendingRequestTo(null);
    }
  };

  // Handle friend request actions
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
            } catch (error) {
              console.error('Error removing friend:', error);
            }
          },
        },
      ]
    );
  };

  // Tab button renderer
  const renderTabButton = (tab: TabType, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon as any}
        size={22}
        color={activeTab === tab ? Colors.primary : Colors.secondaryText}
      />
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && styles.activeTabButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Check if current tab is empty
  const isEmpty = activeTab === 'feed' 
    ? activityFeed.length === 0 
    : friends.length === 0 && pendingRequests.length === 0;

  const isLoading = activeTab === 'feed' ? isLoadingActivity : isLoadingFriends;

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('feed', 'Feed', 'newspaper-outline')}
        {renderTabButton('friends', 'Friends', 'people-outline')}
        <TouchableOpacity
          style={styles.searchTabButton}
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search" size={22} color={Colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.contentContainer,
          activeTab === 'friends' && styles.contentContainerPadded
        ]}>
          {activeTab === 'feed' && (
            <ActivityFeedTab
              activityFeed={activityFeed}
              onReaction={handleReaction}
              currentUserId={user?.id}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsTab
              friends={friends}
              pendingRequests={pendingRequests}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
              onRemoveFriend={handleRemoveFriend}
            />
          )}

          {/* Empty State */}
          {isEmpty && !isLoading && (
            <View style={styles.emptyState}>
              <Ionicons
                name={activeTab === 'feed' ? 'newspaper-outline' : 'people-outline'}
                size={64}
                color={Colors.secondaryText}
              />
              <Text style={styles.emptyStateTitle}>
                {activeTab === 'feed' ? 'No Activity Yet' : 'No Friends Yet'}
              </Text>
              <Text style={styles.emptyStateText}>
                {activeTab === 'feed'
                  ? 'Add friends to see their habit progress and achievements here.'
                  : 'Add friends to connect and share your habit journey together.'}
              </Text>
              {activeTab === 'friends' && (
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setShowSearchModal(true)}
                >
                  <Text style={styles.emptyStateButtonText}>Search & Add Friends</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSendFriendRequest={handleSendFriendRequestFromSearch}
        sendingRequestTo={sendingRequestTo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondaryText,
  },
  activeTabButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  searchTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  contentContainerPadded: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    ...Typography.h3,
    color: Colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
