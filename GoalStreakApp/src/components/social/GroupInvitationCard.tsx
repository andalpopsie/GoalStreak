// GroupInvitationCard Component - Displays a pending group invitation with accept/decline actions
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';
import { GroupInvitation } from '../../types/social';

interface GroupInvitationCardProps {
  invitation: GroupInvitation;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing: boolean;
}

export default function GroupInvitationCard({
  invitation,
  onAccept,
  onDecline,
  isProcessing,
}: GroupInvitationCardProps) {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={20} color={Colors.white} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.groupName} numberOfLines={1}>
            {invitation.groupName}
          </Text>
          <Text style={styles.fromText} numberOfLines={1}>
            Invited by {invitation.fromUserName}
          </Text>
        </View>
      </View>

      {/* Description */}
      {invitation.groupDescription ? (
        <Text style={styles.description} numberOfLines={2}>
          {invitation.groupDescription}
        </Text>
      ) : null}

      {/* Member Count */}
      <View style={styles.metaRow}>
        <Ionicons name="people-outline" size={14} color={Colors.secondaryText} />
        <Text style={styles.metaText}>
          {invitation.memberCount} {invitation.memberCount === 1 ? 'member' : 'members'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={onAccept}
          disabled={isProcessing}
          accessibilityLabel={`Accept invitation to ${invitation.groupName}`}
          accessibilityRole="button"
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.declineButton}
          onPress={onDecline}
          disabled={isProcessing}
          accessibilityLabel={`Decline invitation to ${invitation.groupName}`}
          accessibilityRole="button"
        >
          <Ionicons name="close" size={18} color={Colors.secondaryText} />
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,                   // Standard card recipe
    padding: 16,                        // 8 × 2 (base)
    marginBottom: 8,                    // 8 × 1 (tight)
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent1,   // Purple accent
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,                    // 8 × 1 (tight)
  },
  iconContainer: {
    width: 40,                          // 8 × 5
    height: 40,                         // 8 × 5
    borderRadius: 20,
    backgroundColor: Colors.accent1,   // Purple
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,                    // 8 × 2 (base)
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 2,
  },
  fromText: {
    fontSize: 14,                       // caption
    color: Colors.secondaryText,
  },
  description: {
    fontSize: 14,                       // caption
    color: Colors.secondaryText,
    lineHeight: 20,
    marginBottom: 8,                    // 8 × 1 (tight)
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,                   // 8 × 2 (base)
  },
  metaText: {
    fontSize: 14,                       // caption
    color: Colors.secondaryText,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,                            // 8 × 2 (base) — min 16px between buttons
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,                             // 8 × 1 (tight)
    backgroundColor: Colors.accent1,   // Purple accent (#B771E5)
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,                      // 8 × 6 (touch target)
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: 16,                       // body
    fontWeight: '600',                  // semibold
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,                             // 8 × 1 (tight)
    backgroundColor: Colors.gray.light,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,                      // 8 × 6 (touch target)
  },
  declineButtonText: {
    color: Colors.secondaryText,
    fontSize: 16,                       // body
    fontWeight: '500',                  // medium
  },
});
