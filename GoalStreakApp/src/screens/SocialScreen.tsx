// SocialScreen - Social features with real backend integration
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants/theme';
import { useFriends } from '../hooks/useFriends';
import FriendCard from '../components/FriendCard';

type TabType = 'feed' | 'friends' | 'requests';

export default function SocialScreen() {
  // Real social data from useFriends hook
  const {
    friends,
    pendingRequests,
    sentRequests,
    activityFeed,
    isLoadingFriends,
    isLoadingActivity,
    isSendingRequest,
    isProcessingRequest,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refreshFriends,
    refreshActivityFeed,
    hasMoreActivities,
    error,
  } = useFriends();

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [friendMessage, setFriendMessage] = useState('');

  const handleSendFriendRequest = async () => {
    if (!friendEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      await sendFriendRequest(friendEmail.trim(), friendMessage.trim() || undefined);
      Alert.alert('Success', 'Friend request sent!');
      setFriendEmail('');
      setFriendMessage('');
      setShowAddFriendModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      Alert.alert('Success', 'Friend request declined');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline friend request');
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
              await refreshFriends();
              Alert.alert('Success', 'Friend removed');
            } catch (error: any) {
              console.error('Remove friend error:', error);
              Alert.alert('Error', error.message || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const renderTabButton = (tab: TabType, title: string, icon: string, badge?: number) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? Colors.primary : Colors.secondaryText} 
      />
      <Text style={[
        styles.tabText, 
        activeTab === tab && styles.activeTabText
      ]}>
        {title}
      </Text>
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={Colors.secondaryText} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshFriends}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const getEmptyState = () => {
      switch (activeTab) {
        case 'feed':
          return {
            icon: 'newspaper-outline',
            title: 'Activity Feed',
            subtitle: 'See your friends\' habit progress and achievements here. Add friends to get started!'
          };
        case 'friends':
          return {
            icon: 'people-outline',
            title: 'Friends',
            subtitle: 'Connect with friends to share your habit journey. Use the + button above to add friends!'
          };
        case 'requests':
          return {
            icon: 'mail-outline',
            title: 'Friend Requests',
            subtitle: 'Friend requests you send or receive will appear here.'
          };
        default:
          return {
            icon: 'newspaper-outline',
            title: 'Social Features',
            subtitle: 'Social features are ready to use!'
          };
      }
    };

    const emptyState = getEmptyState();
    const isEmpty = activeTab === 'feed' ? activityFeed.length === 0 : 
                   activeTab === 'friends' ? friends.length === 0 :
                   pendingRequests.length === 0 && sentRequests.length === 0;

    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={activeTab === 'feed' ? isLoadingActivity : isLoadingFriends}
            onRefresh={activeTab === 'feed' ? refreshActivityFeed : refreshFriends}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={isEmpty ? styles.emptyList : styles.listContainer}
      >
        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <Ionicons name={emptyState.icon as any} size={48} color={Colors.secondaryText} />
            <Text style={styles.emptyTitle}>{emptyState.title}</Text>
            <Text style={styles.emptySubtitle}>{emptyState.subtitle}</Text>
          </View>
        ) : (
          <>
            {activeTab === 'feed' && activityFeed.map((item, index) => (
              <View key={index} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityUser}>{item.userName}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(item.timestamp?.toDate?.() || item.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.activityText}>
                  {item.type === 'habit_completed' && `Completed "${item.habitName}"`}
                  {item.type === 'streak_milestone' && `🔥 ${item.streakCount} day streak on "${item.habitName}"!`}
                  {item.type === 'habit_created' && `Started tracking "${item.habitName}"`}
                </Text>
                {item.streakCount && item.type === 'habit_completed' && (
                  <Text style={styles.activityStreak}>🔥 {item.streakCount} day streak</Text>
                )}
              </View>
            ))}

            {activeTab === 'friends' && friends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                type="friend"
                onRemove={() => handleRemoveFriend(friend.friendId)}
              />
            ))}

            {activeTab === 'requests' && (
              <>
                {pendingRequests.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
                    {pendingRequests.map((request) => (
                      <View key={request.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.primaryText }}>
                            {request.fromUserName}
                          </Text>
                          <Text style={{ fontSize: 14, color: Colors.secondaryText }}>
                            {request.fromUserEmail}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                          <TouchableOpacity 
                            style={{ backgroundColor: '#22C55E', padding: 8, borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => handleAcceptRequest(request.id)}
                          >
                            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{ backgroundColor: '#EF4444', padding: 8, borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => handleDeclineRequest(request.id)}
                          >
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </>
                )}
                
                {sentRequests.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Sent Requests</Text>
                    {sentRequests.map((request) => (
                      <FriendCard
                        key={request.id}
                        friendRequest={request}
                        type="sent"
                        onCancel={() => handleDeclineRequest(request.id)}
                        isLoading={isProcessingRequest}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('feed', 'Feed', 'newspaper-outline')}
        {renderTabButton('friends', 'Friends', 'people-outline')}
        {renderTabButton('requests', 'Requests', 'mail-outline')}
        <TouchableOpacity
          style={styles.addFriendTabButton}
          onPress={() => setShowAddFriendModal(true)}
        >
          <Ionicons name="person-add" size={20} color={Colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriendModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddFriendModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddFriendModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Friend's Email</Text>
            <TextInput
              style={styles.textInput}
              value={friendEmail}
              onChangeText={setFriendEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Message (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              value={friendMessage}
              onChangeText={setFriendMessage}
              placeholder="Add a personal message..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleSendFriendRequest}
              style={[styles.sendButton, isSendingRequest && styles.sendButtonDisabled]}
              disabled={isSendingRequest}
            >
              <Text style={styles.sendButtonText}>
                {isSendingRequest ? 'Sending Request...' : 'Send Friend Request'}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                Social features are now connected to the backend! Friend requests are being processed.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  addButton: {
    padding: 2,
  },
  addFriendTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginLeft: 4,
    fontSize: 16,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    color: Colors.primary,
    fontSize: 16,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.primaryText,
  },
  headerSpacer: {
    width: 60,
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    ...Typography.body,
    color: Colors.primary,
    marginLeft: 8,
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    ...Typography.h3,
    color: Colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.primaryText,
    marginBottom: 12,
    marginTop: 8,
  },
  activityCard: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityUser: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  activityText: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: 4,
  },
  activityStreak: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
});
