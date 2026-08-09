import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { TimerConfig } from '../../types/timer';
import { formatTimerDuration } from '../../utils/timerValidation';
import TimerConfigModal from './TimerConfigModal';

interface TimerToggleProps {
  timerConfig?: TimerConfig;
  onTimerConfigChange: (config: TimerConfig | undefined) => void;
  habitName?: string;
}

export default function TimerToggle({
  timerConfig,
  onTimerConfigChange,
  habitName,
}: TimerToggleProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleToggleTimer = () => {
    if (timerConfig?.enabled) {
      // If timer is enabled, show config modal to edit or disable
      setShowConfigModal(true);
    } else {
      // If timer is disabled, show config modal to enable and configure
      setShowConfigModal(true);
    }
  };

  const handleSaveConfig = (config: TimerConfig) => {
    onTimerConfigChange(config);
    setShowConfigModal(false);
  };

  const handleCancelConfig = () => {
    setShowConfigModal(false);
  };

  const isEnabled = timerConfig?.enabled || false;
  const durationText = timerConfig?.durationMinutes 
    ? formatTimerDuration(timerConfig.durationMinutes)
    : '';

  return (
    <>
      <TouchableOpacity 
        style={styles.container}
        onPress={handleToggleTimer}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="timer-outline" 
              size={24} 
              color={isEnabled ? Colors.accent1 : Colors.gray.medium} 
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>Timer</Text>
            <Text style={styles.description}>
              {isEnabled 
                ? `${durationText} • Auto-complete ${timerConfig?.autoComplete ? 'on' : 'off'}`
                : 'Add a timer to track time spent'
              }
            </Text>
          </View>
          
          <View style={styles.actionContainer}>
            {isEnabled && (
              <View style={styles.enabledIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent3} />
              </View>
            )}
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={Colors.gray.medium} 
            />
          </View>
        </View>
      </TouchableOpacity>

      <TimerConfigModal
        habit={habitName ? { id: '', name: habitName } : undefined}
        isVisible={showConfigModal}
        initialConfig={timerConfig}
        onSave={handleSaveConfig}
        onCancel={handleCancelConfig}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  enabledIndicator: {
    // Visual indicator that timer is enabled
  },
});