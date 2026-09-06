// LinkHabitsModal Component - Modal for selecting habits to link to a group
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Typography } from '../../constants/theme';
import { Habit } from '../../types/index';
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryIcons';

interface LinkHabitsModalProps {
  visible: boolean;
  onClose: () => void;
  onLink: (habits: { id: string; name: string; category: string }[]) => Promise<void>;
  userHabits: Habit[];
  alreadyLinkedHabitIds: string[];
  isLinking: boolean;
}

const MAX_HABITS = 6;

export default function LinkHabitsModal({
  visible,
  onClose,
  onLink,
  userHabits,
  alreadyLinkedHabitIds,
  isLinking,
}: LinkHabitsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const alreadyLinkedSet = useMemo(() => new Set(alreadyLinkedHabitIds), [alreadyLinkedHabitIds]);

  const remainingSlots = MAX_HABITS - alreadyLinkedSet.size;
  const canSelectMore = selectedIds.size < remainingSlots;

  const toggleHabit = useCallback(
    (habitId: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(habitId)) {
          next.delete(habitId);
        } else if (next.size < remainingSlots) {
          next.add(habitId);
        }
        return next;
      });
    },
    [remainingSlots]
  );

  const handleConfirm = useCallback(async () => {
    if (selectedIds.size === 0 || isLinking) return;

    const habitsToLink = userHabits
      .filter((h) => selectedIds.has(h.id))
      .map((h) => ({ id: h.id, name: h.name, category: h.category }));

    try {
      await onLink(habitsToLink);
      setSelectedIds(new Set());
      onClose();
    } catch {
      // Error handled by parent
    }
  }, [selectedIds, isLinking, userHabits, onLink, onClose]);

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            accessibilityLabel="Close link habits modal"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Link Habits</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Limit Indicator */}
        <View style={styles.limitBar}>
          <Text style={styles.limitText}>
            {alreadyLinkedSet.size + selectedIds.size}/{MAX_HABITS} habits linked
          </Text>
          <View style={styles.limitProgress}>
            <View
              style={[
                styles.limitProgressFill,
                {
                  width: `${((alreadyLinkedSet.size + selectedIds.size) / MAX_HABITS) * 100}%`,
                },
                alreadyLinkedSet.size + selectedIds.size >= MAX_HABITS && styles.limitProgressFull,
              ]}
            />
          </View>
        </View>

        {/* Habits List */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {userHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color={Colors.gray.medium} />
              <Text style={styles.emptyText}>No habits to link. Create some habits first!</Text>
            </View>
          ) : (
            userHabits.map((habit) => {
              const isAlreadyLinked = alreadyLinkedSet.has(habit.id);
              const isSelected = selectedIds.has(habit.id);
              const isDisabled = isAlreadyLinked || (!isSelected && !canSelectMore);
              const catColor = getCategoryColor(habit.category);
              const catIcon = getCategoryIcon(habit.category, habit.name, habit.icon);

              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.habitRow,
                    isSelected && styles.habitRowSelected,
                    isAlreadyLinked && styles.habitRowLinked,
                  ]}
                  onPress={() => !isAlreadyLinked && toggleHabit(habit.id)}
                  disabled={isAlreadyLinked}
                  accessibilityLabel={`${habit.name}${isAlreadyLinked ? ', already linked' : isSelected ? ', selected' : ''}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: isSelected || isAlreadyLinked,
                    disabled: isDisabled,
                  }}
                >
                  {/* Checkbox */}
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                      isAlreadyLinked && styles.checkboxLinked,
                    ]}
                  >
                    {(isSelected || isAlreadyLinked) && (
                      <Ionicons name="checkmark" size={16} color={Colors.white} />
                    )}
                  </View>

                  {/* Habit Icon */}
                  <View style={[styles.habitIcon, { backgroundColor: catColor }]}>
                    <Ionicons name={catIcon as any} size={16} color={Colors.white} />
                  </View>

                  {/* Habit Info */}
                  <View style={styles.habitInfo}>
                    <Text
                      style={[styles.habitName, isAlreadyLinked && styles.habitNameLinked]}
                      numberOfLines={1}
                    >
                      {habit.name}
                    </Text>
                    {isAlreadyLinked && <Text style={styles.linkedLabel}>Already linked</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, selectedIds.size === 0 && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={selectedIds.size === 0 || isLinking}
            accessibilityLabel={`Link ${selectedIds.size} habits`}
            accessibilityRole="button"
          >
            {isLinking ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.confirmButtonText}>
                Link {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}Habit
                {selectedIds.size !== 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 16, // 8 × 2 (base)
    paddingVertical: 16, // 8 × 2 (base)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
    backgroundColor: Colors.white,
  },
  closeButton: {
    width: 48, // 8 × 6 (touch target)
    height: 48, // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20, // subheading
    fontWeight: '600', // semibold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
  },
  headerSpacer: {
    width: 48,
  },
  limitBar: {
    paddingHorizontal: 16, // 8 × 2 (base)
    paddingVertical: 16, // 8 × 2 (base)
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  limitText: {
    fontSize: 14, // caption
    fontWeight: '500', // medium
    color: Colors.primaryText,
    marginBottom: 8, // 8 × 1 (tight)
    fontFamily: Typography.fontFamily.medium,
  },
  limitProgress: {
    height: 8, // 8 × 1
    backgroundColor: Colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  limitProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent3, // Teal
    borderRadius: 4,
  },
  limitProgressFull: {
    backgroundColor: Colors.error, // Red when at limit
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16, // 8 × 2 (base)
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48, // 8 × 6 (spacious)
    gap: 16, // 8 × 2 (base)
  },
  emptyText: {
    fontSize: 16, // body
    color: Colors.secondaryText,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.regular,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16, // 8 × 2 (base)
    marginBottom: 8, // 8 × 1 (tight)
    minHeight: 56, // 8 × 7
    ...Shadows.sm,
  },
  habitRowSelected: {
    borderWidth: 2,
    borderColor: Colors.accent1, // Purple
  },
  habitRowLinked: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24, // 8 × 3
    height: 24, // 8 × 3
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16, // 8 × 2 (base)
  },
  checkboxSelected: {
    backgroundColor: Colors.accent1, // Purple
    borderColor: Colors.accent1,
  },
  checkboxLinked: {
    backgroundColor: Colors.gray.dark,
    borderColor: Colors.gray.dark,
  },
  habitIcon: {
    width: 32, // 8 × 4
    height: 32, // 8 × 4
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16, // 8 × 2 (base)
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16, // body
    fontWeight: '500', // medium
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.medium,
  },
  habitNameLinked: {
    color: Colors.secondaryText,
  },
  linkedLabel: {
    fontSize: 12, // small
    color: Colors.secondaryText,
    marginTop: 2,
    fontFamily: Typography.fontFamily.regular,
  },
  footer: {
    padding: 16, // 8 × 2 (base)
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
    backgroundColor: Colors.white,
  },
  confirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent1, // Purple CTA
    borderRadius: 16,
    minHeight: 56, // 8 × 7 (primary button)
    paddingVertical: 16, // 8 × 2 (base)
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 16, // body
    fontWeight: '700', // bold
    fontFamily: Typography.fontFamily.bold,
  },
});
