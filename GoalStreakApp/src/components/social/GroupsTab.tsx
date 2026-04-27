// GroupsTab Component - Groups list with pending invitations and create button
import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';
import { useGroups } from '../../hooks/useGroups';
import { Group } from '../../types/social';
import groupService from '../../services/groupService';
import GroupCard from './GroupCard';
import GroupInvitationCard from './GroupInvitationCard';

interface GroupsTabProps {
  onCreateGroup: () => void;
  onNavigateToGroup: (groupId: string) => void;
}

export default function GroupsTab({ onCreateGroup, onNavigateToGroup }: GroupsTabProps) {
  const {
    groups,
    recentlyEndedGroups,
    pendingInvitations,
    isLoadingGroups,
    isProcessingInvitation,
    acceptInvitation,
    declineInvitation,
  } = useGroups();

  // Track completion percentages for each group
  const [completionMap, setCompletionMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCompletions = async () => {
      const map: Record<string, number> = {};
      for (const group of groups) {
        try {
          const pct = await groupService.getGroupCompletionPercentage(group.id);
          map[group.id] = pct;
        } catch {
          map[group.id] = 0;
        }
      }
      setCompletionMap(map);
    };

    if (groups.length > 0) {
      fetchCompletions();
    }
  }, [groups]);

  const handleAcceptInvitation = useCallback(async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  }, [acceptInvitation]);

  const handleDeclineInvitation = useCallback(async (invitationId: string) => {
    try {
      await declineInvitation(invitationId);
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  }, [declineInvitation]);

  const isEmpty = groups.length === 0 && pendingInvitations.length === 0;

  if (isLoadingGroups) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent1} />
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={Colors.gray.medium} />
        <Text style={styles.emptyTitle}>No Groups Yet</Text>
        <Text style={styles.emptyText}>
          Create a group to track habits together with friends and stay accountable.
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={onCreateGroup}
          accessibilityLabel="Create a group"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <View style={styles.invitationsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="mail-open" size={20} color={Colors.accent1} />
              <Text style={styles.sectionTitle}>Group Invitations</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingInvitations.length}</Text>
            </View>
          </View>

          {pendingInvitations.map((invitation) => (
            <GroupInvitationCard
              key={invitation.id}
              invitation={invitation}
              onAccept={() => handleAcceptInvitation(invitation.id)}
              onDecline={() => handleDeclineInvitation(invitation.id)}
              isProcessing={isProcessingInvitation}
            />
          ))}
        </View>
      )}

      {/* Active Groups Section */}
      {groups.length > 0 && (
        <View style={styles.groupsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people" size={20} color={Colors.primaryText} />
              <Text style={styles.sectionTitle}>My Groups</Text>
            </View>
            <Text style={styles.groupCount}>{groups.length}</Text>
          </View>

          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              completionPercentage={completionMap[group.id] ?? 0}
              onPress={() => onNavigateToGroup(group.id)}
            />
          ))}
        </View>
      )}

      {/* Recently Ended Groups Section (30-day data retention) */}
      {recentlyEndedGroups.length > 0 && (
        <View style={styles.groupsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="time-outline" size={20} color={Colors.secondaryText} />
              <Text style={styles.endedSectionTitle}>Recently Ended</Text>
            </View>
            <Text style={styles.groupCount}>{recentlyEndedGroups.length}</Text>
          </View>

          {recentlyEndedGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              completionPercentage={0}
              onPress={() => onNavigateToGroup(group.id)}
            />
          ))}
        </View>
      )}

      {/* Floating Create Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onCreateGroup}
        accessibilityLabel="Create a new group"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,                  // Space for FAB
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 64,               // 8 × 8 (spacious)
    gap: 16,                            // 8 × 2 (base)
  },
  loadingText: {
    fontSize: 16,                       // body
    color: Colors.secondaryText,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,               // 8 × 8 (spacious)
    paddingHorizontal: 32,             // 8 × 4 (loose)
  },
  emptyTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginTop: 16,                      // 8 × 2 (base)
    marginBottom: 8,                    // 8 × 1 (tight)
  },
  emptyText: {
    fontSize: 16,                       // body
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,                     // 1.5 line height
    marginBottom: 24,                   // 8 × 3 (comfortable)
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,                             // 8 × 1 (tight)
    backgroundColor: Colors.accent1,   // Purple CTA
    paddingHorizontal: 32,             // 8 × 4 (loose)
    paddingVertical: 16,               // 8 × 2 (base)
    borderRadius: 32,                   // Pill-shaped
    minHeight: 56,                      // 8 × 7 (primary button)
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
  },
  invitationsSection: {
    marginBottom: 8,                    // 8 × 1 (tight)
  },
  groupsSection: {
    marginBottom: 8,                    // 8 × 1 (tight)
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
    gap: 8,                             // 8 × 1 (tight)
  },
  sectionTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
  },
  endedSectionTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.secondaryText,
  },
  badge: {
    backgroundColor: Colors.accent1,
    borderRadius: 12,
    minWidth: 24,                       // 8 × 3
    height: 24,                         // 8 × 3
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,              // 8 × 1 (tight)
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,                       // small
    fontWeight: '700',                  // bold
  },
  groupCount: {
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    color: Colors.secondaryText,
  },
  fab: {
    position: 'absolute',
    bottom: 24,                         // 8 × 3 (comfortable)
    right: 0,
    width: 56,                          // 8 × 7
    height: 56,                         // 8 × 7
    borderRadius: 28,
    backgroundColor: Colors.accent1,   // Purple CTA
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
});
