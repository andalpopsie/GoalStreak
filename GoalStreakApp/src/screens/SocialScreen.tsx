// SocialScreen - Main social features interface
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useFriends } from '../hooks/useFriends';
import FriendCard from '../components/FriendCard';
import ActivityCard from '../components/ActivityCard';

type TabType = 'feed' | 'friends' | 'requests';

export default function SocialScreen() {
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
    loadMoreActivities,
    hasMoreActivities,
  } = useFriends();

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
      setFriendEmail('');
      setFriendMessage('');
      setShowAddFriendModal(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const renderTabButton = (tab: TabType, title: string, icon: string, badge?: number) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <View style={styles.tabContent}>
        <Ionicons
          name={icon as any}
          size={20}
          color={activeTab === tab ? Colors.white : Colors.gray.dark}
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
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <FlatList
            data={activityFeed}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ActivityCard activity={item} />}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingActivity}
                onRefresh={refreshActivityFeed}
                colors={[Colors.accent1]}
                tintColor={Colors.accent1}
              />
            }
            onEndReached={() => {
              if (hasMoreActivities && !isLoadingActivity) {
                loadMoreActivities();
              }
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={Colors.gray.medium} />
                <Text style={styles.emptyTitle}>No Activity Yet</Text>
                <Text style={styles.emptyText}>
                  Add friends to see their habit progress and share your own achievements!
                </Text>
                <TouchableOpacity
                  style={styles.addFriendsButton}
                  onPress={() => setActiveTab('friends')}
                >
                  <Text style={styles.addFriendsButtonText}>Add Friends</Text>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={activityFeed.length === 0 ? styles.emptyList : undefined}
          />
        );

      case 'friends':
        return (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={isLoadingFriends}
                onRefresh={refreshFriends}
                colors={[Colors.accent1]}
                tintColor={Colors.accent1}
              />
            }
            contentContainerStyle={friends.length === 0 ? styles.emptyList : undefined}
          >
            {friends.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
                </View>
                {friends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    type="friend"
                    onRemove={() => removeFriend(friend.friendId)}
                    isLoading={isProcessingRequest}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-add-outline" size={64} color={Colors.gray.medium} />
                <Text style={styles.emptyTitle}>No Friends Yet</Text>
                <Text style={styles.emptyText}>
                  Start building your habit community by adding friends!
                </Text>
              </View>
            )}
          </ScrollView>
        );

      case 'requests':
        return (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={isLoadingFriends}
                onRefresh={refreshFriends}
                colors={[Colors.accent1]}
                tintColor={Colors.accent1}
              />
            }
            contentContainerStyle={pendingRequests.length === 0 && sentRequests.length === 0 ? styles.emptyList : undefined}
          >
            {pendingRequests.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
                </View>
                {pendingRequests.map((request) => (
                  <FriendCard
                    key={request.id}
                    friendRequest={request}
                    type="pending"
                    onAccept={() => acceptFriendRequest(request.id)}
                    onDecline={() => declineFriendRequest(request.id)}
                    isLoading={isProcessingRequest}
                  />
                ))}
              </>
            )}

            {sentRequests.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Sent Requests ({sentRequests.length})</Text>
                </View>
                {sentRequests.map((request) => (
                  <FriendCard
                    key={request.id}
                    friendRequest={request}
                    type="sent"
                    onCancel={() => declineFriendRequest(request.id)}
                    isLoading={isProcessingRequest}
                  />
                ))}
              </>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="mail-outline" size={64} color={Colors.gray.medium} />
                <Text style={styles.emptyTitle}>No Requests</Text>
                <Text style={styles.emptyText}>
                  Friend requests will appear here
                </Text>
              </View>
            )}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddFriendModal(true)}
        >
          <Ionicons name="person-add" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('feed', 'Feed', 'newspaper-outline')}
        {renderTabButton('friends', 'Friends', 'people-outline', friends.length)}
        {renderTabButton('requests', 'Requests', 'mail-outline', pendingRequests.length)}
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
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddFriendModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <TouchableOpacity
              onPress={handleSendFriendRequest}
              disabled={isSendingRequest || !friendEmail.trim()}
            >
              <Text style={[
                styles.sendButton,
                (!friendEmail.trim() || isSendingRequest) && styles.disabledButton
              ]}>
                {isSendingRequest ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={friendEmail}
                onChangeText={setFriendEmail}
                placeholder="friend@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Message (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                value={friendMessage}
                onChangeText={setFriendMessage}
                placeholder="Hi! Let's track habits together on GoalStreak!"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.tipContainer}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.gray.medium} />
              <Text style={styles.tipText}>
                Your friend will receive a notification and can accept or decline your request.
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
  },
  addButton: {
    padding: Spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: Colors.primaryText,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.medium,
  },
  activeTabText: {
    color: Colors.white,
  },
  badge: {
    backgroundColor: Colors.accent1,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: Typography.fontSize.md * 1.4,
    marginBottom: Spacing.lg,
  },
  addFriendsButton: {
    backgroundColor: Colors.accent1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  addFriendsButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
  },
  cancelButton: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
  },
  sendButton: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent1,
    fontFamily: Typography.fontFamily.semibold,
  },
  disabledButton: {
    color: Colors.gray.medium,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray.medium,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.regular,
    backgroundColor: Colors.white,
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.gray.light,
    padding: Spacing.md,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * 1.4,
  },
});
