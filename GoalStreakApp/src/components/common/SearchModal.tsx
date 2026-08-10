import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';
import friendService from '../../services/friendService';
import { UserSearchResult } from '../../types/social';
import { useModeration } from '../../hooks/useModeration';
import * as ModerationFilter from '../../services/moderationFilter';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSendFriendRequest: (user: UserSearchResult) => Promise<void>;
  sendingRequestTo: string | null;
}

export default function SearchModal({ 
  visible, 
  onClose, 
  onSendFriendRequest, 
  sendingRequestTo
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Moderation: hide blocked users from search results. Gate on `ready` so a
  // stale, unfiltered list is never shown before the block set has loaded.
  const { state: moderationState, ready: moderationReady } = useModeration();
  const visibleResults = moderationReady
    ? ModerationFilter.filterSearchResults(moderationState, searchResults)
    : [];

  // Search for users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await friendService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Search Users</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.secondaryText} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor={Colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          <View style={styles.searchResults}>
            {isSearching || !moderationReady ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Searching...</Text>
              </View>
            ) : searchQuery.length > 0 ? (
              visibleResults.length > 0 ? (
                visibleResults.map((user) => (
                  <View key={user.id} style={styles.resultCard}>
                    <View style={styles.profilePhoto}>
                      <Text style={styles.initials}>
                        {(user.name || user.email)?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>
                        {user.name || user.email?.split('@')[0] || 'Unknown User'}
                      </Text>
                      <Text style={styles.resultEmail}>{user.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        sendingRequestTo === user.id && styles.addButtonDisabled,
                        user.hasPendingRequest && styles.addButtonPending,
                        user.isFriend && styles.addButtonFriends
                      ]}
                      onPress={() => !user.isFriend && !user.hasPendingRequest ? onSendFriendRequest(user) : null}
                      disabled={sendingRequestTo === user.id || user.isFriend || user.hasPendingRequest}
                    >
                      {sendingRequestTo === user.id ? (
                        <Ionicons name="hourglass" size={16} color={Colors.white} />
                      ) : user.isFriend ? (
                        <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                      ) : user.hasPendingRequest ? (
                        <Ionicons name="time" size={16} color={Colors.white} />
                      ) : (
                        <Ionicons name="person-add" size={16} color={Colors.white} />
                      )}
                      <Text style={styles.addButtonText}>
                        {sendingRequestTo === user.id ? 'Sending...' :
                         user.isFriend ? 'Friends' :
                         user.hasPendingRequest ? 'Pending' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={48} color={Colors.secondaryText} />
                  <Text style={styles.emptyStateText}>No users found</Text>
                  <Text style={styles.emptyStateSubtext}>Try searching with a different name or email</Text>
                </View>
              )
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people" size={48} color={Colors.secondaryText} />
                <Text style={styles.emptyStateText}>Find Friends</Text>
                <Text style={styles.emptyStateSubtext}>Search for users by name or email to send friend requests</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 16,
    color: Colors.primary,
  },
  title: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border + '30',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: 16,
    color: Colors.primaryText,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  searchResults: {
    flex: 1,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    minHeight: 60,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initials: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    fontWeight: '600',
  },
  resultInfo: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  resultName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  resultEmail: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.accent3,
    minWidth: 80,
    justifyContent: 'center',
  },
  addButtonText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  addButtonDisabled: {
    backgroundColor: Colors.secondaryText,
  },
  addButtonPending: {
    backgroundColor: '#FFA500', // Orange color for pending
  },
  addButtonFriends: {
    backgroundColor: '#4CAF50', // Green color for friends
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
});
