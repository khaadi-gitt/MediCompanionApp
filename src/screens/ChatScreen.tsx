import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export function ChatScreen({
  userId,
  sessionMessages,
  initialText,
  onAppendMessage,
  onGoHome,
}: {
  userId: string | null;
  sessionMessages: ChatMsg[];
  initialText: string;
  onAppendMessage: (msg: ChatMsg) => void;
  onGoHome: () => void;
}) {
  const backendApiBase = String(process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const contentWidth = Math.min(isDesktop ? 760 : 560, width - 20);
  const bottomSafe = Platform.OS === 'android' ? 0 : 10;
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState(initialText);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(sessionMessages);

  useEffect(() => {
    setMessages(sessionMessages);
  }, [sessionMessages]);

  const sendSpecificMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isSending) return;

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', text };
    const nextHistory = [...messages, userMsg];

    setMessages((prev) => [...prev, userMsg]);
    onAppendMessage(userMsg);
    setInputText('');

    try {
      setIsSending(true);
      let data: any = null;
      if (backendApiBase) {
        const resp = await fetch(`${backendApiBase.replace(/\/+$/, '')}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: nextHistory.slice(-8).map((m) => ({ role: m.role, text: m.text })),
            user_id: userId,
          }),
        });
        data = await resp.json();
        if (!resp.ok) {
          throw new Error(data?.error || 'Backend chat request failed.');
        }
      } else {
        const invoke = await supabase.functions.invoke('medical-chat', {
          body: {
            message: text,
            history: nextHistory.slice(-8).map((m) => ({ role: m.role, text: m.text })),
            user_id: userId,
          },
        });
        if (invoke.error) throw invoke.error;
        data = invoke.data;
      }

      const reply = typeof data?.reply === 'string' && data.reply.trim() ? data.reply.trim() : 'Sorry, the server returned an invalid response.';
      const assistantMsg = { id: `a-${Date.now()}`, role: 'assistant' as const, text: reply };
      setMessages((prev) => [...prev, assistantMsg]);
      onAppendMessage(assistantMsg);
    } catch (e: any) {
      const detail = String(e?.message || '').trim();
      const errMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant' as const,
        text: detail
          ? `Connection error: ${detail}`
          : 'Connection error: check Supabase Function deployment and project keys in .env.',
      };
      setMessages((prev) => [...prev, errMsg]);
      onAppendMessage(errMsg);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    setInputText(initialText.trim());
  }, [initialText]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, isSending]);

  const sendMessage = async () => {
    await sendSpecificMessage(inputText);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      enabled={Platform.OS === 'ios'}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.chatRoot, { paddingBottom: 0 }]}>
      <View style={[styles.chatContent, { width: contentWidth }]}>
        <View style={styles.chatTopRow}>
          <Pressable style={styles.chatBackBtn} onPress={onGoHome}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#248EA0" />
          </Pressable>
          <Text style={styles.chatTitle}>New Chat</Text>
          <View style={styles.chatTopRight} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[styles.chatBubble, m.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant]}
            >
              <Text style={m.role === 'user' ? styles.chatTextUser : styles.chatTextAssistant}>{m.text}</Text>
            </View>
          ))}
          {isSending ? (
            <View style={[styles.chatBubble, styles.chatBubbleAssistant]}>
              <Text style={styles.chatTextAssistant}>Typing...</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.chatComposer, { marginBottom: bottomSafe }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your medical question..."
            placeholderTextColor="#8A93A4"
            style={styles.chatInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable style={[styles.chatSendBtn, isSending && styles.chatSendBtnDisabled]} onPress={sendMessage}>
            <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chatRoot: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) + 6 : 10,
  },
  chatContent: {
    flex: 1,
    paddingBottom: 0,
  },
  chatScroll: {
    flex: 1,
  },
  chatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chatBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCE6EE',
    backgroundColor: '#E7F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#274058',
  },
  chatTopRight: {
    width: 40,
  },
  chatList: {
    paddingBottom: 84,
    gap: 10,
  },
  chatBubble: {
    maxWidth: '86%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#25AFC0',
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEAF3',
  },
  chatTextUser: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  chatTextAssistant: {
    color: '#2E3C50',
    fontSize: 14,
  },
  chatComposer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'android' ? 4 : 0,
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: '#D4E4F1',
    backgroundColor: '#FFFFFF',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
  },
  chatInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3B4F',
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#25AFC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendBtnDisabled: {
    opacity: 0.6,
  },
});
