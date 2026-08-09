import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants/theme';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSendRequest: (email: string, message: string) => Promise<void>;
  isLoading: boolean;
}

export default function AddFriendModal({ 
  visible, 
  onClose, 
  onSendRequest, 
  isLoading 
}: AddFriendModalProps) {
  const [friendEmail, setFriendEmail] = useState('');
  const [friendMessage, setFriendMessage] = useState('');

  const handleSendRequest = async () => {
    if (!friendEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!friendEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await onSendRequest(friendEmail.trim(), friendMessage.trim());
      setFriendEmail('');
      setFriendMessage('');
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    setFriendEmail('');
    setFriendMessage('');
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
          <Text style={styles.title}>Add Friend</Text>
          <TouchableOpacity 
            onPress={handleSendRequest}
            disabled={isLoading || !friendEmail.trim()}
          >
            <Text style={[
              styles.sendButton,
              (isLoading || !friendEmail.trim()) && styles.sendButtonDisabled
            ]}>
              {isLoading ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter friend's email"
            placeholderTextColor={Colors.secondaryText}
            value={friendEmail}
            onChangeText={setFriendEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <Text style={styles.label}>Message (Optional)</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Add a personal message..."
            placeholderTextColor={Colors.secondaryText}
            value={friendMessage}
            onChangeText={setFriendMessage}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isLoading}
          />

          <Text style={styles.helpText}>
            Send a friend request to connect and share your habit progress together.
          </Text>
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
    fontSize: 16,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
  },
  sendButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semibold,
  },
  sendButtonDisabled: {
    color: Colors.secondaryText,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 8,
    fontFamily: Typography.fontFamily.semibold,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.primaryText,
    backgroundColor: Colors.surface,
    marginBottom: 20,
    fontFamily: Typography.fontFamily.regular,
  },
  messageInput: {
    height: 80,
    paddingTop: 12,
  },
  helpText: {
    fontSize: 14,
    color: Colors.secondaryText,
    lineHeight: 20,
    marginTop: 10,
    fontFamily: Typography.fontFamily.regular,
  },
});
