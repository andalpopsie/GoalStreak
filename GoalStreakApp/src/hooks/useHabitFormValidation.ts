import { useCallback } from 'react';
import { CreateHabitForm, Habit } from '../types';
import { LIMITS } from '../constants/limits';

// Validation constants
const HABIT_NAME_MIN_LENGTH = 2;
const HABIT_NAME_MAX_LENGTH = 50;
const TARGET_VALUE_MAX = 10000;
const HABIT_NAME_PATTERN = /^[a-zA-Z0-9\s\-_.,!?()]+$/;

interface ValidationErrors {
  [key: string]: string;
}

export function useHabitFormValidation(habits: Habit[]) {
  const isAtHabitLimit = useCallback((): boolean => {
    return habits.length >= LIMITS.MAX_HABITS;
  }, [habits]);

  const validateHabitName = useCallback((name: string): string | null => {
    const trimmedName = name.trim()
      .replace(/[<>]/g, '') // Basic XSS prevention
      .replace(/\s+/g, ' '); // Normalize whitespace

    if (!trimmedName) {
      return 'Habit name is required';
    }
    if (trimmedName.length < HABIT_NAME_MIN_LENGTH) {
      return `Habit name must be at least ${HABIT_NAME_MIN_LENGTH} characters`;
    }
    if (trimmedName.length > HABIT_NAME_MAX_LENGTH) {
      return `Habit name must be less than ${HABIT_NAME_MAX_LENGTH} characters`;
    }
    if (!HABIT_NAME_PATTERN.test(trimmedName)) {
      return 'Habit name contains invalid characters';
    }
    if (/^\s|\s$/.test(name)) {
      return 'Habit name cannot start or end with spaces';
    }

    // Check for duplicate habit names
    const duplicateHabit = habits.find(h =>
      h.name.toLowerCase().trim() === trimmedName.toLowerCase()
    );
    if (duplicateHabit) {
      return 'A habit with this name already exists';
    }

    return null;
  }, [habits]);

  const validateTargetValue = useCallback((targetValue?: number, unit?: string): { targetValue?: string; unit?: string } => {
    const errors: { targetValue?: string; unit?: string } = {};

    if (targetValue !== undefined) {
      if (targetValue <= 0) {
        errors.targetValue = 'Target value must be greater than 0';
      } else if (targetValue > TARGET_VALUE_MAX) {
        errors.targetValue = `Target value must be less than ${TARGET_VALUE_MAX.toLocaleString()}`;
      }

      // Unit validation when target value is set
      if (!unit?.trim()) {
        errors.unit = 'Unit is required when target value is set';
      }
    }

    return errors;
  }, []);

  const validateForm = useCallback((form: CreateHabitForm): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Check habit limit first
    if (isAtHabitLimit()) {
      errors.limit = `You've reached the maximum of ${LIMITS.MAX_HABITS} habits. Delete a habit to create a new one.`;
      return errors;
    }

    // Validate habit name
    const nameError = validateHabitName(form.name);
    if (nameError) {
      errors.name = nameError;
    }

    // Validate target value and unit
    const targetErrors = validateTargetValue(form.targetValue, form.unit);
    Object.assign(errors, targetErrors);

    // Category validation
    if (!form.category) {
      errors.category = 'Please select a category';
    }

    return errors;
  }, [validateHabitName, validateTargetValue, isAtHabitLimit]);

  return {
    validateForm,
    validateHabitName,
    validateTargetValue,
    isAtHabitLimit,
  };
}