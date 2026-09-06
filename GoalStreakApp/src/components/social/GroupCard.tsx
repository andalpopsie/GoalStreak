// GroupCard Component - Displays group summary in the Groups tab list
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows, Typography } from '../../constants/theme';
import { Group } from '../../types/social';
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryIcons';

interface GroupCardProps {
  group: Group;
  completionPercentage: number;
  onPress: () => void;
}

export default function GroupCard({ group, completionPercentage, onPress }: GroupCardProps) {
  const categoryIcon = getCategoryIcon(group.category);
  const categoryColor = getCategoryColor(group.category);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${group.name} group, ${group.members.length} members, ${completionPercentage}% complete today`}
      accessibilityRole="button"
    >
      {/* Category Icon */}
      <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
        <Ionicons name={categoryIcon as any} size={24} color={Colors.white} />
      </View>

      {/* Group Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.groupName} numberOfLines={1}>
          {group.name}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color={Colors.secondaryText} />
          <Text style={styles.memberCount}>
            {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>

      {/* Completion Percentage */}
      <View style={styles.completionContainer}>
        <Text style={styles.completionText}>{completionPercentage}%</Text>
        <Text style={styles.completionLabel}>today</Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={Colors.gray.medium} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16, // Standard card recipe
    padding: 16, // 8 × 2 (base)
    marginBottom: 8, // 8 × 1 (tight)
    ...Shadows.sm,
  },
  iconContainer: {
    width: 48, // 8 × 6
    height: 48, // 8 × 6
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16, // 8 × 2 (base)
  },
  infoContainer: {
    flex: 1,
    marginRight: 16, // 8 × 2 (base)
  },
  groupName: {
    fontSize: 16, // body
    fontWeight: '600', // semibold
    color: Colors.primaryText,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 14, // caption
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
  },
  completionContainer: {
    alignItems: 'center',
    marginRight: 8, // 8 × 1 (tight)
  },
  completionText: {
    fontSize: 20, // subheading
    fontWeight: '700', // bold
    color: Colors.accent3, // teal (#4A90A4)
    fontFamily: Typography.fontFamily.bold,
  },
  completionLabel: {
    fontSize: 12, // small
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
  },
});
