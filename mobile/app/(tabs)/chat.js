import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api, { appendImageToFormData } from '../../src/services/api';
import chatWS from '../../src/services/websocket';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

export default function ChatScreen() {
  const { user, couple } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const partner = couple?.memberships?.find((m) => m.user.id !== user?.id)?.user;

  // 1. Fetch message history (also used for reliable 3s live sync)
  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get('/chat/messages/');
      const list = res.data.results || res.data;
      if (Array.isArray(list)) {
        setMessages(list);
      }
    } catch (e) {
      console.warn('Error fetching messages:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    chatWS.connect();
    chatWS.sendReadReceipt();

    // Reliable real-time sync every 3s in case WebSocket drops on Render free tier
    const pollInterval = setInterval(fetchMessages, 3000);

    // 2. Setup WebSocket Listeners
    const removeListener = chatWS.addListener((data) => {
      if (data.type === 'new_message' && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(data.message.id))) return prev;
          return [data.message, ...prev];
        });
        chatWS.sendReadReceipt();
      } else if (data.type === 'typing') {
        setPartnerTyping(data.is_typing);
      } else if (data.type === 'presence') {
        setPartnerOnline(data.is_online);
      }
    });

    return () => {
      clearInterval(pollInterval);
      removeListener();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [fetchMessages]);

  const handleTextChange = (text) => {
    setInputText(text);

    chatWS.sendTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      chatWS.sendTyping(false);
    }, 2000);
  };

  const handleSendMessage = async (type = 'text', customContent = null) => {
    const textToSend = customContent || inputText.trim();
    if (!textToSend && type === 'text') return;
    if (sending) return;

    setChatError('');
    setInputText('');
    setSending(true);
    chatWS.sendTyping(false);

    // Always persist via REST API so messages are guaranteed saved & delivered
    try {
      const res = await api.post('/chat/send/', {
        message_type: type,
        content: textToSend,
      });
      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(res.data.id))) return prev;
        return [res.data, ...prev];
      });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Impossible d’envoyer le message.';
      setChatError(msg);
      if (Platform.OS !== 'web') Alert.alert('Erreur', msg);
    } finally {
      setSending(false);
    }
  };

  const sendHeartPulse = () => {
    handleSendMessage('heart', '❤️ Un gros câlin et coup de cœur pour toi !');
  };

  const pickImage = async () => {
    setChatError('');
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l’accès aux photos.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('message_type', 'image');
      formData.append('content', '📷 Photo partagée');
      await appendImageToFormData(formData, 'file', asset, 'photo.jpg');

      try {
        const res = await api.post('/chat/send/', formData);
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(res.data.id))) return prev;
          return [res.data, ...prev];
        });
      } catch (e) {
        const msg = 'Échec de l’envoi de la photo.';
        setChatError(msg);
        if (Platform.OS !== 'web') Alert.alert('Erreur', msg);
      }
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await api.post(`/chat/messages/${messageId}/react/`, { emoji });
      fetchMessages();
    } catch (e) {
      console.warn('Reaction error:', e);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.sender?.id === user?.id;
    const isHeart = item.message_type === 'heart';

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.partnerMessageRow]}>
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myBubble : styles.partnerBubble,
            isHeart && styles.heartBubble,
          ]}
        >
          {item.attachments && item.attachments.length > 0 && (
            <Image source={{ uri: item.attachments[0].file }} style={styles.attachedImage} />
          )}

          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.partnerMessageText]}>
            {item.content}
          </Text>

          <View style={styles.messageFooter}>
            <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.partnerTimeText]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && (
              <Ionicons
                name="checkmark-done"
                size={14}
                color={COLORS.deepBlack}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>

          {/* Quick Reaction Tray on Long Press */}
          <View style={styles.reactionContainer}>
            {['❤️', '🔥', '😂'].map((em) => (
              <TouchableOpacity
                key={em}
                onPress={() => handleReaction(item.id, em)}
                style={styles.reactionButton}
              >
                <Text style={styles.reactionEmoji}>{em}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Top Header */}
      <View style={styles.header}>
        <View style={styles.partnerInfo}>
          <View style={styles.avatarContainer}>
            {partner?.profile?.avatar ? (
              <Image source={{ uri: partner.profile.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{partner?.first_name?.[0] || 'B'}</Text>
              </View>
            )}
            <View
              style={[
                styles.onlineBadge,
                { backgroundColor: partnerOnline ? COLORS.success : COLORS.textMuted },
              ]}
            />
          </View>
          <View>
            <Text style={styles.partnerHeaderName}>
              {partner?.profile?.nickname || partner?.first_name || 'Mon Amour'}
            </Text>
            <Text style={styles.partnerHeaderStatus}>
              {partnerTyping ? '✍️ en train d’écrire...' : partnerOnline ? 'En ligne' : 'Déconnecté(e)'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.heartPulseBtn} onPress={sendHeartPulse} activeOpacity={0.7}>
          <Text style={{ fontSize: 24 }}>❤️</Text>
        </TouchableOpacity>
      </View>

      {/* Message List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={COLORS.primaryRose} size="large" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessageItem}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Error Banner */}
      {!!chatError && (
        <View style={{ backgroundColor: 'rgba(239,68,68,0.16)', paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#fca5a5', fontSize: 12.5, textAlign: 'center' }}>{chatError}</Text>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color={COLORS.primaryRose} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Écris un mot doux à ton Bae..."
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={handleTextChange}
          multiline
        />

        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.disabledSend]}
          onPress={() => handleSendMessage('text')}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={18} color={COLORS.deepBlack} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepBlack,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.primaryRose,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.primaryRose,
    fontSize: 18,
    fontWeight: '800',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  partnerHeaderName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  partnerHeaderStatus: {
    color: COLORS.primaryRose,
    fontSize: 12,
    marginTop: 2,
  },
  heartPulseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(242, 167, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  messageRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  partnerMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: COLORS.primaryRose,
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: COLORS.surfaceElevated,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  heartBubble: {
    backgroundColor: 'rgba(255, 77, 109, 0.9)',
  },
  attachedImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.deepBlack,
    fontWeight: '500',
  },
  partnerMessageText: {
    color: COLORS.textPrimary,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  myTimeText: {
    color: 'rgba(23, 21, 28, 0.65)',
  },
  partnerTimeText: {
    color: COLORS.textMuted,
  },
  reactionContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  reactionButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  mediaButton: {
    padding: 8,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sendButton: {
    backgroundColor: COLORS.primaryRose,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledSend: {
    opacity: 0.5,
  },
});

