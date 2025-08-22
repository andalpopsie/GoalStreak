import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useHabits } from '../hooks/useHabits';
import Button from '../components/Button';
import { CreateHabitForm, HabitCategory, HabitFrequency } from '../types';

interface CreateHabitScreenNewProps {
  navigation: any;
}

const HABIT_TEMPLATES = [
  {
    id: 'exercise',
    name: 'Exercise',
    icon: 'fitness',
    category: 'fitness' as HabitCategory,
    description: 'Daily workout or physical activity',
    targetValue: 30,
    unit: 'minutes',
  },
  {
    id: 'meditation',
    name: 'Meditation',
    icon: 'leaf',
    category: 'mindfulness' as HabitCategory,
    description: 'Daily mindfulness practice',
    targetValue: 10,
    unit: 'minutes',
  },
  {
    id: 'reading',
    name: 'Reading',
    icon: 'book',
    category: 'learning' as HabitCategory,
    description: 'Daily reading habit',
    targetValue: 20,
    unit: 'minutes',
  },
  {
    id: 'water',
    name: 'Drink Water',
    icon: 'water',
    category: 'wellness' as HabitCategory,
    description: 'Stay hydrated throughout the day',
    targetValue: 8,
    unit: 'glasses',
  },
  {
    id: 'sleep',
    name: 'Sleep Early',
    icon: 'bed',
    category: 'wellness' as HabitCategory,
    description: 'Get to bed before 10 PM',
  },
  {
    id: 'custom',
    name: 'Custom Habit',
    icon: 'add',
    category: 'other' as HabitCategory,
    description: 'Create your own habit',
  },
];

export default function CreateHabitScreenNew({ navigation }: CreateHabitScreenNewProps) {
  const { createHabit, isCreating } = useHabits();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customHabitName, setCustomHabitName] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'custom') {
      setShowCustomForm(true);
      setSelectedTemplate(templateId);
    } else {
      setSelectedTemplate(templateId);
      setShowCustomForm(false);
    }
  };

  const handleCreateHabit = async () => {
    if (!selectedTemplate) {
      Alert.alert('Please select a habit', 'Choose a habit template to get started');
      return;
    }

    const template = HABIT_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    let habitName = template.name;
    if (selectedTemplate === 'custom') {
      if (!customHabitName.trim()) {
        Alert.alert('Habit name required', 'Please enter a name for your custom habit');
        return;
      }
      habitName = customHabitName.trim();
    }

    const habitData: CreateHabitForm = {
      name: habitName,
      description: template.description,
      category: template.category,
      frequency: 'daily',
      targetValue: template.targetValue,
      unit: template.unit,
      isPublic: true,
    };

    try {
      await createHabit(habitData);
      Alert.alert('Success!', `${habitName} habit created successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error creating habit:', error);
      Alert.alert('Error', error.message || 'Failed to create habit');
    }
  };

  const getIconName = (iconType: string) => {
    const iconMap: Record<string, string> = {
      fitness: 'fitness',
      leaf: 'leaf',
      book: 'book',
      water: 'water',
      bed: 'bed',
      add: 'add',
    };
    return iconMap[iconType] || 'ellipse';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.title}>Create New Habit</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Choose a habit to get started</Text>

        {/* Habit Templates Grid */}
        <View style={styles.templatesGrid}>
          {HABIT_TEMPLATES.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                selectedTemplate === template.id && styles.templateCardSelected
              ]}
              onPress={() => handleTemplateSelect(template.id)}
            >
              <View style={[
                styles.iconCircle,
                selectedTemplate === template.id ? styles.iconCircleSelected : styles.iconCircleDefault
              ]}>
                <Ionicons 
                  name={getIconName(template.icon) as any} 
                  size={32} 
                  color={selectedTemplate === template.id ? Colors.background : Colors.primaryText} 
                />
              </View>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateDescription}>{template.description}</Text>
              {template.targetValue && (
                <Text style={styles.templateTarget}>
                  {template.targetValue} {template.unit}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Habit Form */}
        {showCustomForm && (
          <View style={styles.customForm}>
            <Text style={styles.customFormTitle}>Custom Habit Details</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Enter habit name (e.g., 'Learn Spanish')"
              value={customHabitName}
              onChangeText={setCustomHabitName}
              placeholderTextColor={Colors.accent2}
            />
          </View>
        )}

        {/* Create Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isCreating ? "Creating..." : "Create Habit"}
            onPress={handleCreateHabit}
            disabled={!selectedTemplate || isCreating}
            loading={isCreating}
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent2 + '20',
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  templateCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.primaryText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateCardSelected: {
    borderColor: Colors.accent1,
    backgroundColor: Colors.accent1 + '10',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconCircleDefault: {
    backgroundColor: Colors.accent2 + '20',
  },
  iconCircleSelected: {
    backgroundColor: Colors.accent1,
  },
  templateName: {
    ...Typography.h4,
    color: Colors.primaryText,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  templateDescription: {
    ...Typography.caption,
    color: Colors.primaryText,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  templateTarget: {
    ...Typography.caption,
    color: Colors.accent1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  customForm: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: Colors.primaryText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customFormTitle: {
    ...Typography.h4,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  customInput: {
    borderWidth: 1,
    borderColor: Colors.accent2 + '40',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.primaryText,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
});
