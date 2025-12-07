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
import { useHabits } from '../hooks/useHabits';
import { ReactionType, UserSearchResult } from '../types/social';
import { SearchModal } from '../components/common';
import { ActivityFeedTab, FriendsTab } from '../components/social';
import { friendSuggestionsService, SuggestedFriend } from '../services/friendSuggestionsService';

type TabType = 'feed' | 'friends';

export default function SocialScreen() {
  const { user } = useAuth();
  const { habits } = useHabits();
  
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
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);

  // Auto-load feed data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'feed') {
      refreshActivityFeed();
    } else {
      refreshFriends();
      loadSuggestedFriends();
    }
  }, [activeTab, refreshActivityFeed, refreshFriends, loadSuggestedFriends]);

  // Load suggested friends
  const loadSuggestedFriends = useCallback(async () => {
    if (!user?.id || habits.length === 0) {
      console.log('⚠️ Cannot load suggestions:', { hasUser: !!user?.id, habitCount: habits.length });
      return;
    }

    try {
      console.log('🔍 Loading suggested friends...');
      const friendIds = friends.map(f => f.friendId);
      const suggestions = await friendSuggestionsService.getSuggestedFriends(
        user.id,
        habits,
        friendIds,
        5
      );
      console.log('✅ Found suggestions:', suggestions.length);
      setSuggestedFriends(suggestions);
    } catch (error) {
      console.error('❌ Error loading suggested friends:', error);
    }
  }, [user?.id, habits, friends]);

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
              currentUserName={user?.displayName || user?.email?.split('@')[0] || 'User'}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsTab
              friends={friends}
              pendingRequests={pendingRequests}
              suggestedFriends={suggestedFriends}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
              onRemoveFriend={handleRemoveFriend}
              onSendFriendRequest={async (email) => {
                try {
                  await sendFriendRequest(email, 'Hi! Let\'s connect on GoalStreak!');
                  Alert.alert('Success', 'Friend request sent!');
                  // Refresh suggestions
                  loadSuggestedFriends();
                } catch (error: any) {
                  Alert.alert('Error', error.message || 'Failed to send request');
                }
              }}
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
    borderBottomColor: Colors.gray.light,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,                // 8 * 2 (base)
    gap: 8,                             // 8 * 1 (tight)
    minHeight: 56,                      // 8 * 7 (touch target)
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 16,                       // body
    fontWeight: '500',                  // medium
    color: Colors.secondaryText,
  },
  activeTabButtonText: {
    color: Colors.primary,
    fontWeight: '600',                  // semibold
  },
  searchTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,                // 8 * 2 (base)
    paddingHorizontal: 20,              // 8 * 2.5
    minHeight: 56,                      // 8 * 7 (touch target)
    minWidth: 56,                       // 8 * 7 (touch target)
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  contentContainerPadded: {
    paddingHorizontal: 16,              // 8 * 2 (base)
    paddingTop: 8,                      // 8 * 1 (tight)
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,                // 8 * 8 (spacious)
    paddingHorizontal: 32,              // 8 * 4 (loose)
  },
  emptyStateTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginTop: 16,                      // 8 * 2 (base)
    marginBottom: 8,                    // 8 * 1 (tight)
  },
  emptyStateText: {
    fontSize: 16,                       // body
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,                     // 1.5 line height
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,              // 8 * 4 (loose)
    paddingVertical: 16,                // 8 * 2 (base)
    borderRadius: 32,                   // Pill-shaped (modern)
    marginTop: 24,                      // 8 * 3 (comfortable)
    minHeight: 56,                      // 8 * 7 (touch target)
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
  },
});
