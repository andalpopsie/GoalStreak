import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, CategoryColors, Typography } from '../../constants/theme';
import { LIMITS } from '../../constants/limits';
import { HabitTemplate, HabitCategory } from '../../types';

// Move outside component to prevent recreation on each render
const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: 'drink-water',
    name: 'Drink 8 glasses of water',
    category: 'nutrition',
    icon: 'water',
    description: 'Stay hydrated throughout the day',
    difficulty: 'easy',
    popularity: 95,
    tips: [
      'Start with a glass when you wake up',
      'Use a water tracking app',
      'Add lemon for flavor',
    ],
  },
  {
    id: 'morning-walk',
    name: '10-minute morning walk',
    category: 'fitness',
    icon: 'walk',
    description: 'Start your day with gentle movement',
    difficulty: 'easy',
    popularity: 88,
    tips: [
      'Lay out clothes the night before',
      'Start with 5 minutes',
      'Listen to podcasts while walking',
    ],
  },
  {
    id: 'meditation',
    name: '5-minute meditation',
    category: 'wellness',
    icon: 'leaf',
    description: 'Practice mindfulness and reduce stress',
    difficulty: 'medium',
    popularity: 82,
    tips: ['Use a meditation app', 'Find a quiet space', 'Focus on your breath'],
  },
  {
    id: 'read-daily',
    name: 'Read for 15 minutes',
    category: 'productivity',
    icon: 'book',
    description: 'Expand your knowledge and vocabulary',
    difficulty: 'easy',
    popularity: 76,
    tips: ['Keep a book by your bed', 'Try audiobooks during commute', 'Join a book club'],
  },
  {
    id: 'gratitude-journal',
    name: "Write 3 things I'm grateful for",
    category: 'wellness',
    icon: 'heart',
    description: 'Practice gratitude and positive thinking',
    difficulty: 'easy',
    popularity: 71,
    tips: ['Keep a journal by your bed', 'Be specific in your entries', 'Include small moments'],
  },
  {
    id: 'call-family',
    name: 'Call a family member',
    category: 'social',
    icon: 'call',
    description: 'Stay connected with loved ones',
    difficulty: 'easy',
    popularity: 68,
    tips: ['Schedule regular call times', 'Keep conversations positive', 'Ask about their day'],
  },
  {
    id: 'exercise',
    name: '20-minute workout',
    category: 'fitness',
    icon: 'fitness',
    description: 'Build strength and endurance',
    difficulty: 'medium',
    popularity: 85,
    tips: ['Start with bodyweight exercises', 'Use workout apps', 'Schedule consistent times'],
  },
  {
    id: 'healthy-meal',
    name: 'Eat a healthy breakfast',
    category: 'nutrition',
    icon: 'restaurant',
    description: 'Fuel your day with nutritious food',
    difficulty: 'easy',
    popularity: 79,
    tips: [
      'Prep ingredients the night before',
      'Include protein and fiber',
      'Avoid processed foods',
    ],
  },
  {
    id: 'learn-skill',
    name: 'Practice a new skill for 15 minutes',
    category: 'productivity',
    icon: 'school',
    description: 'Develop new abilities and knowledge',
    difficulty: 'medium',
    popularity: 64,
    tips: ['Choose one skill to focus on', 'Use online courses', 'Practice consistently'],
  },
];

interface HabitSuggestionsProps {
  onSelectHabits: (habits: HabitTemplate[]) => void;
  onSkip: () => void;
}

export default React.memo(function HabitSuggestions({
  onSelectHabits,
  onSkip,
}: HabitSuggestionsProps) {
  const [selectedHabits, setSelectedHabits] = useState<HabitTemplate[]>([]);

  const toggleHabit = (habit: HabitTemplate) => {
    setSelectedHabits((prev) => {
      const isSelected = prev.some((h) => h.id === habit.id);
      if (isSelected) {
        return prev.filter((h) => h.id !== habit.id);
      } else {
        if (prev.length >= LIMITS.MAX_HABITS) {
          Alert.alert(
            'Maximum Habits Reached',
            `You can select up to ${LIMITS.MAX_HABITS} habits to start your journey. We recommend starting with 2-3 for best results!`,
            [{ text: 'Got it' }]
          );
          return prev;
        }
        return [...prev, habit];
      }
    });
  };

  const getDifficultyColor = (difficulty: HabitTemplate['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return Colors.accent3;
      case 'medium':
        return Colors.accent1;
      case 'hard':
        return '#FF6B6B';
      default:
        return Colors.gray.medium;
    }
  };

  const getCategoryColor = (category: HabitCategory) => {
    return CategoryColors[category] || CategoryColors.other;
  };

  const handleContinue = () => {
    if (selectedHabits.length === 0) {
      Alert.alert(
        'No Habits Selected',
        'Starting with some habits will help you build momentum. Would you like to select a few, or continue to create your own?',
        [
          { text: 'Select Habits', style: 'default' },
          { text: 'Create My Own', onPress: onSkip },
        ]
      );
      return;
    }
    onSelectHabits(selectedHabits);
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
        <Text style={styles.title}>Start with Popular Habits</Text>
        <Text style={styles.subtitle}>
          Choose up to {LIMITS.MAX_HABITS} habits to begin your journey. We recommend starting with
          2-3 for best results!
        </Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {HABIT_TEMPLATES.map((habit, index) => {
          const isSelected = selectedHabits.some((h) => h.id === habit.id);

          return (
            <Animated.View key={habit.id} entering={FadeInUp.delay(400 + index * 100)}>
              <TouchableOpacity
                style={[styles.habitCard, isSelected && styles.habitCardSelected]}
                onPress={() => toggleHabit(habit)}
                accessibilityRole="button"
                accessibilityLabel={`${habit.name}. ${habit.description}. Difficulty: ${habit.difficulty}. ${isSelected ? 'Selected' : 'Not selected'}`}
                accessibilityHint={
                  isSelected
                    ? 'Double tap to deselect this habit'
                    : 'Double tap to select this habit'
                }
              >
                <View style={styles.habitHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: getCategoryColor(habit.category) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={habit.icon as keyof typeof Ionicons.glyphMap}
                      size={28}
                      color={getCategoryColor(habit.category)}
                    />
                  </View>

                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Text style={styles.habitDescription}>{habit.description}</Text>

                    <View style={styles.habitMeta}>
                      <View
                        style={[
                          styles.difficultyBadge,
                          { backgroundColor: getDifficultyColor(habit.difficulty) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyText,
                            { color: getDifficultyColor(habit.difficulty) },
                          ]}
                        >
                          {habit.difficulty}
                        </Text>
                      </View>

                      <Text style={styles.popularityText}>{habit.popularity}% of users</Text>
                    </View>
                  </View>

                  <View style={styles.selectionIndicator}>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={28} color={Colors.accent1} />
                    ) : (
                      <View style={styles.unselectedCircle} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(800)} style={styles.footer}>
        <Text style={styles.selectionCount}>
          {selectedHabits.length}/{LIMITS.MAX_HABITS} habits selected
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedHabits.length === 0 && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              {selectedHabits.length > 0 ? 'Create Habits' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.white,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 16,
    color: Colors.primaryText,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  habitCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.gray.light,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitCardSelected: {
    borderColor: Colors.accent1,
    backgroundColor: Colors.accent1 + '08',
    shadowColor: Colors.accent1,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 6,
    lineHeight: 22,
  },
  habitDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
    opacity: 0.7,
    lineHeight: 20,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: Spacing.md,
  },
  difficultyText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popularityText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: Colors.primaryText,
    opacity: 0.6,
    fontWeight: '500',
  },
  selectionIndicator: {
    marginLeft: Spacing.md,
  },
  unselectedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.gray.medium,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 50,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  selectionCount: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 16,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
  },
  skipButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 16,
    color: Colors.primaryText,
    opacity: 0.7,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: Colors.accent1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.gray.light,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginRight: Spacing.sm,
  },
});
