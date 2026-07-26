// BlockedUsersScreen - Manage the current user's Block_List (report-and-block 12.1)
//
// Lists the users the current user has blocked (the Block_List — the `blocks`
// records where the current user is the `blockerId`, R3.2) and lets them unblock
// each one. Unblock flows through a confirmation dialog (R3.4) and calls
// useModeration.unblockUser so the live block-set subscription stays in sync.
// On success the row is removed and a confirmation is shown (R3.4); on failure
// the row is retained and an error is shown (R3.5). An empty state is shown when
// the Block_List is empty (R3.1).
//
// _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { Colors, Typography, Spacing } from '../constants/theme';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useModeration } from '../hooks/useModeration';
import friendService from '../services/friendService';
import { Block } from '../types/social';

interface BlockedRow {
  block: Block;
  displayName: string;
}

/**
 * Resolve a friendly display name for a blocked user id. Block_Relationship
 * records store only opaque UIDs (privacy note in requirements), so we read the
 * public user doc to show a name. Falls back gracefully to whatever is available.
 */
async function resolveDisplayName(userId: string): Promise<string> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data() as Record<string, any>;
      const name = data.name || data.displayName || data.username || data.email;
      if (name && typeof name === 'string' && name.trim().length > 0) {
        return name.trim();
      }
    }
  } catch {
    // Fall through to the generic label on any read error.
  }
  return 'Blocked user';
}

export default function BlockedUsersScreen() {
  const { user } = useAuth();
  const { unblockUser } = useModeration();
  const userId = user?.id;

  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingIds, setUnblockingIds] = useState<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadBlockedUsers = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      const blocks = await friendService.getBlockedUsers(userId);
      const resolved = await Promise.all(
        blocks.map(async (block) => ({
          block,
          displayName: await resolveDisplayName(block.blockedUserId),
        }))
      );
      if (isMountedRef.current) {
        setRows(resolved);
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
      if (isMountedRef.current) {
        Alert.alert('Blocked Users', "Couldn't load your blocked users. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const performUnblock = useCallback(
    async (row: BlockedRow) => {
      const targetId = row.block.blockedUserId;
      setUnblockingIds((prev) => new Set(prev).add(targetId));
      try {
        await unblockUser(targetId);
        // Success: remove the row and confirm (R3.4).
        if (isMountedRef.current) {
          setRows((prev) => prev.filter((r) => r.block.blockedUserId !== targetId));
          Alert.alert('Unblocked', `You unblocked ${row.displayName}.`);
        }
      } catch (error) {
        // Failure: retain the row and show an error (R3.5).
        console.error('Error unblocking user:', error);
        if (isMountedRef.current) {
          Alert.alert('Unblock failed', "Couldn't unblock user. Please try again.");
        }
      } finally {
        if (isMountedRef.current) {
          setUnblockingIds((prev) => {
            const next = new Set(prev);
            next.delete(targetId);
            return next;
          });
        }
      }
    },
    [unblockUser]
  );

  const confirmUnblock = useCallback(
    (row: BlockedRow) => {
      Alert.alert(
        'Unblock user',
        `Unblock ${row.displayName}? You'll be able to see each other again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            style: 'default',
            onPress: () => performUnblock(row),
          },
        ]
      );
    },
    [performUnblock]
  );

  const renderRow = useCallback(
    ({ item }: { item: BlockedRow }) => {
      const targetId = item.block.blockedUserId;
      const isUnblocking = unblockingIds.has(targetId);
      return (
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={Colors.white} />
            </View>
            <Text style={styles.rowName} numberOfLines={1}>
              {item.displayName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.unblockButton}
            onPress={() => confirmUnblock(item)}
            disabled={isUnblocking}
            accessibilityRole="button"
            accessibilityLabel={`Unblock ${item.displayName}`}
          >
            {isUnblocking ? (
              <ActivityIndicator size="small" color={Colors.accent1} />
            ) : (
              <Text style={styles.unblockButtonText}>Unblock</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [confirmUnblock, unblockingIds]
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent1} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="ban-outline" size={48} color={Colors.gray.medium} />
          <Text style={styles.emptyTitle}>You haven't blocked anyone</Text>
          <Text style={styles.emptySubtitle}>
            Users you block will appear here so you can unblock them later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.block.id}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.comfortable, // 24
  },
  emptyTitle: {
    fontSize: Typography.fontSize.subheading, // 20
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: '600',
    color: Colors.primaryText,
    marginTop: Spacing.base, // 16
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.body, // 16
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryText,
    marginTop: Spacing.tight, // 8
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingVertical: Spacing.tight, // 8
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16, // 8 * 2 (standard list recipe)
    paddingHorizontal: 24, // 8 * 3
    minHeight: 56, // 8 * 7 (touch target)
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: Colors.white,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.base, // 16
  },
  avatar: {
    width: 40, // 8 * 5
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.tight, // 8
  },
  rowName: {
    flex: 1,
    fontSize: Typography.fontSize.body, // 16
    fontFamily: Typography.fontFamily.medium,
    fontWeight: '500',
    color: Colors.primaryText,
  },
  unblockButton: {
    minHeight: 48, // touch target
    minWidth: 96,
    paddingVertical: Spacing.tight, // 8
    paddingHorizontal: Spacing.base, // 16
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockButtonText: {
    fontSize: Typography.fontSize.caption, // 14
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: '600',
    color: Colors.accent1,
  },
});
