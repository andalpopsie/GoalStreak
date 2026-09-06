import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface IconPickerProps {
  selectedIcon?: string;
  onIconSelect: (iconName: string) => void;
  onClose: () => void;
}

// Curated list of beautiful, relevant icons for habits - SIMPLE GUARANTEED IONICONS
const HABIT_ICONS = [
  // Fitness & Health
  { name: 'fitness', category: 'Fitness' },
  { name: 'walk', category: 'Fitness' },
  { name: 'bicycle', category: 'Fitness' },
  { name: 'body', category: 'Fitness' }, // Yoga
  { name: 'barbell', category: 'Fitness' }, // Weightlifting
  { name: 'water', category: 'Fitness' }, // Swimming
  { name: 'heart', category: 'Health' },
  { name: 'pulse', category: 'Health' },
  { name: 'medical', category: 'Health' },

  // Pets & Animals
  { name: 'paw', category: 'Pets' }, // Pet care

  // Sleep & Rest
  { name: 'moon', category: 'Sleep' },
  { name: 'bed', category: 'Sleep' },
  { name: 'time', category: 'Sleep' },

  // Mindfulness & Wellness
  { name: 'leaf', category: 'Mindfulness' },
  { name: 'flower', category: 'Mindfulness' },
  { name: 'sunny', category: 'Mindfulness' },

  // Nutrition & Water
  { name: 'restaurant', category: 'Nutrition' },
  { name: 'water', category: 'Nutrition' },
  { name: 'cafe', category: 'Nutrition' },

  // Learning & Productivity
  { name: 'book', category: 'Learning' },
  { name: 'school', category: 'Learning' },
  { name: 'pencil', category: 'Productivity' },
  { name: 'briefcase', category: 'Productivity' },
  { name: 'laptop', category: 'Productivity' },

  // Social & Communication
  { name: 'people', category: 'Social' },
  { name: 'happy', category: 'Social' },
  { name: 'chatbubbles', category: 'Social' },
  { name: 'call', category: 'Social' },
  { name: 'home', category: 'Social' },

  // Creative & Hobbies
  { name: 'brush', category: 'Creative' },
  { name: 'musical-notes', category: 'Creative' },
  { name: 'camera', category: 'Creative' },
  { name: 'game-controller', category: 'Creative' },

  // Self-Care & Daily
  { name: 'car', category: 'Daily' },
  { name: 'calendar', category: 'Daily' },
  { name: 'alarm', category: 'Daily' },
  { name: 'location', category: 'Daily' },

  // Goals & Achievement
  { name: 'trophy', category: 'Goals' },
  { name: 'star', category: 'Goals' },
  { name: 'flame', category: 'Goals' },
  { name: 'trending-up', category: 'Goals' },
  { name: 'checkmark-circle', category: 'Goals' },
  { name: 'ribbon', category: 'Goals' },
];

export default function IconPicker({ selectedIcon, onIconSelect, onClose }: IconPickerProps) {
  const categories = [...new Set(HABIT_ICONS.map((icon) => icon.category))];

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose an Icon</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {categories.map((category) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <View style={styles.iconsGrid}>
                {HABIT_ICONS.filter((icon) => icon.category === category).map((icon) => (
                  <TouchableOpacity
                    key={icon.name}
                    style={[
                      styles.iconButton,
                      selectedIcon === icon.name && styles.selectedIconButton,
                    ]}
                    onPress={() => onIconSelect(icon.name)}
                  >
                    <Ionicons
                      name={icon.name as any}
                      size={28}
                      color={selectedIcon === icon.name ? Colors.white : Colors.primaryText}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    width: '90%',
    height: '80%', // Changed from maxHeight to height
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1, // Added flex: 1 to take remaining space
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIconButton: {
    backgroundColor: Colors.accent1,
    borderColor: Colors.accent1,
  },
});
