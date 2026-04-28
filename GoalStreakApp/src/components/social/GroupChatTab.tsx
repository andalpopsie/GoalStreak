// GroupChatTab — Real-time group messaging inside accountability groups
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { GroupMessage } from '../../types/social';
import groupService from '../../services/groupService';

interface GroupChatTabProps {
  groupId: string;
  currentUserId: string;
  currentUserName: string;
}

export default function GroupChatTab({
  groupId,
  currentUserId,
  currentUserName,
}: GroupChatTabProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    const unsubscribe = groupService.subscribeToMessages(groupId, (newMessages) => {
      setMessages(newMessages);
    });

    return unsubscribe;
  }, [groupId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);
    try {
      await groupService.sendMessage(groupId, currentUserId, currentUserName, text);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(text); // Restore on failure
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, groupId, currentUserId, currentUserName]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const isNewDay = (current: GroupMessage, previous?: GroupMessage) => {
    if (!previous) return true;
    return current.createdAt.toDateString() !== previous.createdAt.toDateString();
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessage = ({ item, index }: { item: GroupMessage; index: number }) => {
    const isMe = item.userId === currentUserId;
    const showDay = isNewDay(item, messages[index - 1]);
    const showName = !isMe && (index === 0 || messages[index - 1]?.userId !== item.userId);

    return (
      <View>
        {showDay && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
          {!isMe && (
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {item.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.messageBubbleWrapper}>
            {showName && !isMe && (
              <Text style={styles.senderName}>{item.userName.split(' ')[0]}</Text>
            )}
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                {item.text}
              </Text>
            </View>
            <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray.medium} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Start the conversation with your group!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          placeholderTextColor={Colors.secondaryText}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() && !isSending ? Colors.white : Colors.gray.medium}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messageList: {
    paddingHorizontal: 16,           // 8 × 2 (base)
    paddingTop: 16,                  // 8 × 2 (base)
    paddingBottom: 8,                // 8 × 1 (tight)
  },
  // Date separator
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,              // 8 × 2 (base)
  },
  dateText: {
    fontSize: 12,                    // small
    fontWeight: '600',               // semibold
    color: Colors.secondaryText,
    backgroundColor: Colors.gray.light,
    paddingHorizontal: 12,           // 8 × 1.5
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  // Message row
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    maxWidth: '80%',
  },
  messageRowMe: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarSmall: {
    width: 28,                       // 8 × 3.5
    height: 28,                      // 8 × 3.5
    borderRadius: 14,
    backgroundColor: Colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,                  // 8 × 1 (tight)
    marginBottom: 16,                // align with bubble bottom
  },
  avatarSmallText: {
    fontSize: 12,                    // small
    fontWeight: '600',               // semibold
    color: Colors.white,
  },
  messageBubbleWrapper: {
    flexShrink: 1,
  },
  senderName: {
    fontSize: 12,                    // small
    fontWeight: '600',               // semibold
    color: Colors.accent1,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 14,          // comfortable
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  bubbleMe: {
    backgroundColor: Colors.accent1,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 15,                    // body-ish
    color: Colors.primaryText,
    lineHeight: 21,
  },
  bubbleTextMe: {
    color: Colors.white,
  },
  timeText: {
    fontSize: 11,                    // small
    color: Colors.secondaryText,
    marginTop: 2,
    marginLeft: 4,
  },
  timeTextMe: {
    textAlign: 'right',
    marginRight: 4,
    marginLeft: 0,
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,           // 8 × 1.5
    paddingVertical: 8,              // 8 × 1 (tight)
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
    gap: 8,                          // 8 × 1 (tight)
  },
  textInput: {
    flex: 1,
    fontSize: 15,                    // body-ish
    color: Colors.primaryText,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,           // 8 × 2 (base)
    paddingVertical: 10,
    maxHeight: 100,
    minHeight: 40,                   // 8 × 5
    lineHeight: 20,
  },
  sendButton: {
    width: 40,                       // 8 × 5
    height: 40,                      // 8 × 5
    borderRadius: 20,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray.light,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,           // 8 × 4 (loose)
    gap: 8,                          // 8 × 1 (tight)
  },
  emptyTitle: {
    fontSize: 18,                    // large body
    fontWeight: '600',               // semibold
    color: Colors.primaryText,
  },
  emptyText: {
    fontSize: 15,                    // body-ish
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
});
