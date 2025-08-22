import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function HabitsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Habits</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Habits</Text>
          <View style={styles.placeholder}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.accent2} />
            <Text style={styles.placeholderTitle}>No habits yet</Text>
            <Text style={styles.placeholderText}>
              Tap the + button to create your first habit and start building streaks!
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {['Fitness', 'Wellness', 'Nutrition', 'Mindfulness'].map((category) => (
              <TouchableOpacity key={category} style={styles.categoryCard}>
                <Text style={styles.categoryText}>{category}</Text>
                <Text style={styles.categoryCount}>0 habits</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent2,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
  },
  addButton: {
    backgroundColor: Colors.accent1,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  placeholder: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent2,
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: Colors.white,
    width: '48%',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  categoryCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent2,
  },
});
