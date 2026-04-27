// GroupDetailScreen - Full group view with Progress and Feed tabs
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Shadows } from '../constants/theme';
import { RootStackParamList } from '../types/index';
import { GroupActivity, ReactionType } from '../types/social';
import { useGroupDetail } from '../hooks/useGroupDetail';
import { useHabits } from '../hooks/useHabits';
import { useAuth } from '../hooks/useAuth';
import GroupProgressCard from '../components/social/GroupProgressCard';
import GroupFeedCard from '../components/social/GroupFeedCard';
import LinkHabitsModal from '../components/social/LinkHabitsModal';
import InviteMembersModal from '../components/social/InviteMembersModal';
import GroupSettingsModal from '../components/social/GroupSettingsModal';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;
type GroupDetailNavProp = StackNavigationProp<RootStackParamList, 'GroupDetail'>;
type DetailTab = 'progress' | 'feed';

const FEED_PAGE_SIZE = 20;

export default function GroupDetailScreen() {
  const route = useRoute<GroupDetailRouteProp>();
  const navigation = useNavigation<GroupDetailNavProp>();
  const { groupId } = route.params;
  const { user } = useAuth();
  const { habits } = useHabits();

  const {
    group,
    progress,
    feed,
    trackedHabits,
    completionPercentage,
    isLoading,
    isLinking,
    linkHabits,
    unlinkHabit,
    inviteMember,
    removeMember,
    leaveGroup,
    endGroup,
    updateGroup,
    addReaction,
    isAdmin,
    error,
  } = useGroupDetail(groupId);

  const [activeTab, setActiveTab] = useState<DetailTab>('progress');
  const [showLinkHabits, setShowLinkHabits] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [feedDisplayCount, setFeedDisplayCount] = useState(FEED_PAGE_SIZE);

  // Set header title
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: group?.name || 'Group',
      headerShown: true,
      headerStyle: { backgroundColor: Colors.background },
      headerTintColor: Colors.primaryText,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          style={styles.headerButton}
          accessibilityLabel="Group settings"
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, group?.name]);

  const handleReaction = useCallback(
    (activityId: string, reactionType: ReactionType) => {
      addReaction(activityId, reactionType);
    },
    [addReaction]
  );

  const handleLoadMoreFeed = useCallback(() => {
    if (feedDisplayCount < feed.length) {
      setFeedDisplayCount((prev) => prev + FEED_PAGE_SIZE);
    }
  }, [feedDisplayCount, feed.length]);

  const alreadyLinkedHabitIds = trackedHabits
    .filter((th) => th.userId === user?.id)
    .map((th) => th.habitId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent1} />
        <Text style={styles.loadingText}>Loading group...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Group not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayedFeed = feed.slice(0, feedDisplayCount);

  return (
    <View style={styles.container}>
      {/* Completion Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{group.members.length}</Text>
          <Text style={styles.summaryLabel}>Members</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.accent3 }]}>
            {completionPercentage}%
          </Text>
          <Text style={styles.summaryLabel}>Today</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{trackedHabits.length}</Text>
          <Text style={styles.summaryLabel}>Habits</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowLinkHabits(true)}
          accessibilityLabel="Link habits to this group"
          accessibilityRole="button"
        >
          <Ionicons name="link-outline" size={18} color={Colors.accent1} />
          <Text style={styles.actionButtonText}>Link Habits</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowInviteMembers(true)}
            accessibilityLabel="Invite members to this group"
            accessibilityRole="button"
          >
            <Ionicons name="person-add-outline" size={18} color={Colors.accent1} />
            <Text style={styles.actionButtonText}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'progress' && styles.activeTabButton]}
          onPress={() => setActiveTab('progress')}
          accessibilityLabel="Progress tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'progress' }}
        >
          <Ionicons
            name="bar-chart-outline"
            size={18}
            color={activeTab === 'progress' ? Colors.primary : Colors.secondaryText}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'progress' && styles.activeTabButtonText]}
          >
            Progress
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'feed' && styles.activeTabButton]}
          onPress={() => setActiveTab('feed')}
          accessibilityLabel="Feed tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'feed' }}
        >
          <Ionicons
            name="newspaper-outline"
            size={18}
            color={activeTab === 'feed' ? Colors.primary : Colors.secondaryText}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'feed' && styles.activeTabButtonText]}
          >
            Feed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'progress' ? (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={styles.tabContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {progress.length > 0 ? (
            progress.map((memberProgress) => (
              <GroupProgressCard
                key={memberProgress.userId}
                memberProgress={memberProgress}
              />
            ))
          ) : (
            <View style={styles.emptyTab}>
              <Ionicons name="bar-chart-outline" size={48} color={Colors.gray.medium} />
              <Text style={styles.emptyTabText}>
                No progress yet. Link habits to start tracking!
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={displayedFeed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroupFeedCard
              activity={item}
              onReaction={handleReaction}
              currentUserId={user?.id || ''}
            />
          )}
          contentContainerStyle={styles.tabContentContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMoreFeed}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyTab}>
              <Ionicons name="newspaper-outline" size={48} color={Colors.gray.medium} />
              <Text style={styles.emptyTabText}>
                No activity yet. Complete a linked habit to get started!
              </Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      <LinkHabitsModal
        visible={showLinkHabits}
        onClose={() => setShowLinkHabits(false)}
        onLink={linkHabits}
        userHabits={habits}
        alreadyLinkedHabitIds={alreadyLinkedHabitIds}
        isLinking={isLinking}
      />

      {isAdmin && (
        <InviteMembersModal
          visible={showInviteMembers}
          onClose={() => setShowInviteMembers(false)}
          groupId={groupId}
          onInvite={inviteMember}
          memberCount={group.members.length}
        />
      )}

      {group && (
        <GroupSettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          group={group}
          isAdmin={isAdmin}
          onUpdateGroup={updateGroup}
          onRemoveMember={removeMember}
          onLeaveGroup={leaveGroup}
          onEndGroup={endGroup}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 16,                            // 8 × 2 (base)
  },
  loadingText: {
    fontSize: 16,                       // body
    color: Colors.secondaryText,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 16,                            // 8 × 2 (base)
    padding: 32,                        // 8 × 4 (loose)
  },
  errorText: {
    fontSize: 16,                       // body
    color: Colors.error,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.accent1,
    paddingHorizontal: 24,             // 8 × 3 (comfortable)
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,                      // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
  },
  headerButton: {
    width: 48,                          // 8 × 6 (touch target)
    height: 48,                         // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,                     // 8 × 1 (tight)
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    paddingVertical: 16,               // 8 × 2 (base)
    paddingHorizontal: 16,             // 8 × 2 (base)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,                       // heading
    fontWeight: '700',                  // bold
    color: Colors.primaryText,
  },
  summaryLabel: {
    fontSize: 12,                       // small
    color: Colors.secondaryText,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 32,                         // 8 × 4
    backgroundColor: Colors.gray.light,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,                             // 8 × 1 (tight)
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 16,               // 8 × 2 (base)
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                             // 8 × 1 (tight)
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 10,
    borderRadius: 24,                   // Pill
    borderWidth: 1,
    borderColor: Colors.accent1,
    minHeight: 40,                      // 8 × 5
  },
  actionButtonText: {
    fontSize: 14,                       // caption
    fontWeight: '600',                  // semibold
    color: Colors.accent1,
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
    paddingVertical: 16,               // 8 × 2 (base)
    gap: 8,                             // 8 × 1 (tight)
    minHeight: 48,                      // 8 × 6 (touch target)
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
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,                        // 8 × 2 (base)
    paddingBottom: 32,                  // 8 × 4 (loose)
  },
  emptyTab: {
    alignItems: 'center',
    paddingVertical: 48,               // 8 × 6 (spacious)
    gap: 16,                            // 8 × 2 (base)
  },
  emptyTabText: {
    fontSize: 16,                       // body
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,                     // 1.5 line height
    paddingHorizontal: 24,             // 8 × 3 (comfortable)
  },
});
