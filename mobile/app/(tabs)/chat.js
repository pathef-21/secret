import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import api, { appendImageToFormData, resolveMediaUrl } from '../../src/services/api';
import chatWS from '../../src/services/websocket';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
}

export default function ChatScreen() {
  const { user, couple } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);

  // Voice message recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const nativeRecordingRef = useRef(null);
  const recordTimerRef = useRef(null);
  const recordStartRef = useRef(0);
  const nativeSoundRef = useRef(null);

  // WebRTC Voice Call state
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [callerName, setCallerName] = useState('');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const peerConnRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const callTimerRef = useRef(null);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const partner = couple?.memberships?.find((m) => String(m.user.id) !== String(user?.id))?.user;

  // 1. Mark read + fetch message history
  const markAsRead = useCallback(async () => {
    try {
      await api.post('/chat/messages/read/');
    } catch {
      // Ignore silent read receipt errors
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get('/chat/messages/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setMessages(list);
      markAsRead();
    } catch (e) {
      const errDetail = e?.response?.data?.detail;
      if (errDetail) setChatError(errDetail);
      console.warn('Error fetching messages:', e);
    } finally {
      setLoading(false);
    }
  }, [markAsRead]);

  // Cleanup WebRTC call resources
  const cleanupCall = useCallback(() => {
    clearInterval(callTimerRef.current);
    callTimerRef.current = null;
    if (peerConnRef.current) {
      try {
        peerConnRef.current.close();
      } catch {}
      peerConnRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.srcObject = null;
      } catch {}
    }
    pendingOfferRef.current = null;
    setCallStatus('idle');
    setCallSeconds(0);
    setIsMuted(false);
  }, []);

  const createPeerConnection = useCallback(() => {
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('Appels vocaux non supportés sur ce navigateur.');
    }
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        chatWS.sendCallSignal('ice', { candidate: event.candidate });
      }
    };
    pc.ontrack = (event) => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        if (!remoteAudioRef.current) {
          const audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.playsInline = true;
          remoteAudioRef.current = audioEl;
        }
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => {
          setCallSeconds((prev) => prev + 1);
        }, 1000);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupCall();
      }
    };
    peerConnRef.current = pc;
    return pc;
  }, [cleanupCall]);

  // Start outgoing voice call
  const startVoiceCall = async () => {
    setChatError('');
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setChatError('Les appels vocaux en direct fonctionnent depuis le navigateur (Chrome/Safari).');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setCallStatus('calling');
      setCallerName(partner?.profile?.nickname || partner?.first_name || 'Mon Bae');
      const sent = chatWS.sendCallSignal('offer', { sdp: offer });
      if (!sent) {
        chatWS.connect();
        setTimeout(() => chatWS.sendCallSignal('offer', { sdp: offer }), 1200);
      }
    } catch (e) {
      cleanupCall();
      setChatError('Impossible d’accéder au micro pour l’appel vocal.');
    }
  };

  // Accept incoming voice call
  const acceptVoiceCall = async () => {
    if (!pendingOfferRef.current) return;
    setChatError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      chatWS.sendCallSignal('answer', { sdp: answer });
      setCallStatus('connected');
      clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      cleanupCall();
      setChatError('Impossible de répondre à l’appel (autorisez le micro).');
    }
  };

  const endVoiceCall = (isReject = false) => {
    chatWS.sendCallSignal(isReject ? 'reject' : 'hangup', {});
    cleanupCall();
  };

  const toggleMuteCall = () => {
    if (localStreamRef.current) {
      const nextMuted = !isMuted;
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
    }
  };

  useEffect(() => {
    fetchMessages();
    chatWS.connect();
    chatWS.sendReadReceipt();

    const pollInterval = setInterval(fetchMessages, 3000);

    const removeListener = chatWS.addListener(async (data) => {
      if (data.type === 'new_message' && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(data.message.id))) return prev;
          return [data.message, ...prev];
        });
        chatWS.sendReadReceipt();
        markAsRead();
      } else if (data.type === 'typing') {
        setPartnerTyping(data.is_typing);
      } else if (data.type === 'presence') {
        setPartnerOnline(data.is_online);
      } else if (data.type === 'call_signal') {
        const { signal_type, payload, sender_name } = data;
        if (signal_type === 'offer' && payload?.sdp) {
          pendingOfferRef.current = payload.sdp;
          setCallerName(sender_name || partner?.profile?.nickname || 'Mon Bae');
          setCallStatus('incoming');
        } else if (signal_type === 'answer' && payload?.sdp && peerConnRef.current) {
          try {
            await peerConnRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            setCallStatus('connected');
          } catch {}
        } else if (signal_type === 'ice' && payload?.candidate && peerConnRef.current) {
          try {
            await peerConnRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch {}
        } else if (signal_type === 'hangup' || signal_type === 'reject') {
          cleanupCall();
        }
      }
    });

    return () => {
      clearInterval(pollInterval);
      clearInterval(recordTimerRef.current);
      removeListener();
      clearTimeout(typingTimeoutRef.current);
      cleanupCall();
    };
  }, [fetchMessages, markAsRead, cleanupCall, partner]);

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

  // Voice message recording (Web MediaRecorder + Native expo-av)
  const startRecording = async () => {
    setChatError('');
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
        setChatError('Enregistrement vocal non supporté par ce navigateur.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) mediaChunksRef.current.push(e.data);
        };
        recorder.start();
        mediaRecorderRef.current = { recorder, stream, mimeType: mimeType || 'audio/webm' };
        recordStartRef.current = Date.now();
        setRecordSeconds(0);
        setIsRecording(true);
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = setInterval(() => {
          setRecordSeconds(Math.floor((Date.now() - recordStartRef.current) / 1000));
        }, 500);
      } catch {
        setChatError('Autorisez le micro pour envoyer un message vocal.');
      }
      return;
    }

    // Native iOS / Android
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser le micro.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      nativeRecordingRef.current = recording;
      recordStartRef.current = Date.now();
      setRecordSeconds(0);
      setIsRecording(true);
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(Math.floor((Date.now() - recordStartRef.current) / 1000));
      }, 500);
    } catch {
      setChatError('Impossible de démarrer l’enregistrement vocal.');
    }
  };

  const cancelRecording = async () => {
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
    if (Platform.OS === 'web' && mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.recorder.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch {}
      mediaRecorderRef.current = null;
    } else if (nativeRecordingRef.current) {
      try {
        await nativeRecordingRef.current.stopAndUnloadAsync();
      } catch {}
      nativeRecordingRef.current = null;
    }
  };

  const sendRecording = async () => {
    clearInterval(recordTimerRef.current);
    const duration = Math.max(1, Math.floor((Date.now() - recordStartRef.current) / 1000));
    setIsRecording(false);
    setRecordSeconds(0);
    setSending(true);
    setChatError('');

    try {
      const formData = new FormData();
      formData.append('message_type', 'audio');
      formData.append('attachment_type', 'audio');
      formData.append('content', `🎙️ Message vocal (${formatDuration(duration)})`);
      formData.append('duration_seconds', String(duration));

      if (Platform.OS === 'web' && mediaRecorderRef.current) {
        const { recorder, stream, mimeType } = mediaRecorderRef.current;
        const blob = await new Promise((resolve) => {
          recorder.onstop = () => {
            resolve(new Blob(mediaChunksRef.current, { type: mimeType }));
          };
          recorder.stop();
        });
        stream.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        formData.append('file', blob, `vocal_${Date.now()}.${ext}`);
      } else if (nativeRecordingRef.current) {
        await nativeRecordingRef.current.stopAndUnloadAsync();
        const uri = nativeRecordingRef.current.getURI();
        nativeRecordingRef.current = null;
        formData.append('file', {
          uri,
          name: `vocal_${Date.now()}.m4a`,
          type: 'audio/m4a',
        });
      }

      const res = await api.post('/chat/send/', formData);
      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(res.data.id))) return prev;
        return [res.data, ...prev];
      });
    } catch (e) {
      setChatError('Échec de l’envoi du message vocal.');
    } finally {
      setSending(false);
    }
  };

  const playNativeAudio = async (id, url) => {
    try {
      if (nativeSoundRef.current) {
        await nativeSoundRef.current.unloadAsync();
        nativeSoundRef.current = null;
      }
      if (playingAudioId === id) {
        setPlayingAudioId(null);
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      nativeSoundRef.current = sound;
      setPlayingAudioId(id);
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.didJustFinish) setPlayingAudioId(null);
      });
    } catch {
      setPlayingAudioId(null);
    }
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
      mediaTypes: ['images'],
      allowsEditing: Platform.OS !== 'web',
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
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
      } catch {
        const msg = 'Échec de l’envoi de la photo.';
        setChatError(msg);
        if (Platform.OS !== 'web') Alert.alert('Erreur', msg);
      }
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = String(item.sender?.id) === String(user?.id);
    const isHeart = item.message_type === 'heart';
    const firstAtt = item.attachments && item.attachments.length > 0 ? item.attachments[0] : null;
    const isAudio = item.message_type === 'audio' || firstAtt?.attachment_type === 'audio';
    const mediaUrl = firstAtt ? resolveMediaUrl(firstAtt.file) : null;

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.partnerMessageRow]}>
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myBubble : styles.partnerBubble,
            isHeart && styles.heartBubble,
          ]}
        >
          {firstAtt && !isAudio && mediaUrl && (
            <Image source={{ uri: mediaUrl }} style={styles.attachedImage} />
          )}

          {isAudio && mediaUrl ? (
            <View style={{ minWidth: 200 }}>
              {Platform.OS === 'web' ? (
                <audio
                  controls
                  src={mediaUrl}
                  style={{ width: 220, height: 36, borderRadius: 12 }}
                />
              ) : (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}
                  onPress={() => playNativeAudio(item.id, mediaUrl)}
                >
                  <Ionicons
                    name={playingAudioId === item.id ? 'pause-circle' : 'play-circle'}
                    size={30}
                    color={isMe ? COLORS.deepBlack : COLORS.primaryRose}
                  />
                  <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.partnerMessageText]}>
                    {item.content || '🎙️ Message vocal'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.partnerMessageText]}>
              {item.content}
            </Text>
          )}

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
              <Image source={{ uri: resolveMediaUrl(partner.profile.avatar) }} style={styles.headerAvatar} />
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.callHeaderBtn}
            onPress={startVoiceCall}
            disabled={callStatus !== 'idle'}
            activeOpacity={0.75}
          >
            <Ionicons name="call" size={20} color="#4ADE80" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.heartPulseBtn} onPress={sendHeartPulse} activeOpacity={0.7}>
            <Text style={{ fontSize: 22 }}>❤️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active / Incoming Voice Call Banner */}
      {callStatus !== 'idle' && (
        <View style={styles.callBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.callBannerTitle}>
              {callStatus === 'incoming'
                ? `📞 Appel vocal de ${callerName}...`
                : callStatus === 'calling'
                ? `📞 Appel de ${callerName} en cours...`
                : `🎙️ En appel avec ${callerName} • ${formatDuration(callSeconds)}`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {callStatus === 'incoming' ? (
              <>
                <TouchableOpacity style={styles.acceptCallBtn} onPress={acceptVoiceCall}>
                  <Ionicons name="call" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.hangupCallBtn} onPress={() => endVoiceCall(true)}>
                  <Ionicons name="call" size={18} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.muteCallBtn} onPress={toggleMuteCall}>
                  <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.hangupCallBtn} onPress={() => endVoiceCall(false)}>
                  <Ionicons name="call" size={18} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Waiting for partner banner if couple has only 1 member */}
      {couple && (!couple.memberships || couple.memberships.length < 2) && (
        <View style={{ backgroundColor: 'rgba(242,167,198,0.14)', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder }}>
          <Text style={{ color: COLORS.primaryRose, fontSize: 12.5, textAlign: 'center', fontWeight: '600' }}>
            💑 Ton/ta partenaire n’a pas encore rejoint cet espace ! Partage ton code depuis Accueil.
          </Text>
        </View>
      )}

      {/* Message List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={COLORS.primaryRose} size="large" />
        </View>
      ) : (
        <ScrollView
          ref={flatListRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.listContent, { flexGrow: 1, justifyContent: 'flex-end' }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={{ color: COLORS.textMuted, fontSize: 14, textAlign: 'center' }}>
                Aucun message pour l’instant. Envoie un premier mot doux ❤️
              </Text>
            </View>
          ) : (
            [...messages].reverse().map((item) => (
              <React.Fragment key={String(item.id)}>
                {renderMessageItem({ item })}
              </React.Fragment>
            ))
          )}
        </ScrollView>
      )}

      {/* Error Banner */}
      {!!chatError && (
        <View style={{ backgroundColor: 'rgba(239,68,68,0.16)', paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#fca5a5', fontSize: 12.5, textAlign: 'center' }}>{chatError}</Text>
        </View>
      )}

      {/* Input Bar / Voice Recording Bar */}
      {isRecording ? (
        <View style={styles.recordingBar}>
          <TouchableOpacity style={styles.cancelRecBtn} onPress={cancelRecording}>
            <Ionicons name="trash-outline" size={20} color="#F87171" />
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <View style={styles.recDot} />
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 }}>
              Enregistrement... {formatDuration(recordSeconds)}
            </Text>
          </View>
          <TouchableOpacity style={styles.sendButton} onPress={sendRecording}>
            <Ionicons name="send" size={18} color={COLORS.deepBlack} />
          </TouchableOpacity>
        </View>
      ) : (
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

          {inputText.trim() ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleSendMessage('text')}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.deepBlack} />
              ) : (
                <Ionicons name="send" size={18} color={COLORS.deepBlack} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.micButton}
              onPress={startRecording}
              disabled={sending}
            >
              <Ionicons name="mic" size={20} color={COLORS.deepBlack} />
            </TouchableOpacity>
          )}
        </View>
      )}
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
  callHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 222, 128, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartPulseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(242, 167, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  callBannerTitle: {
    color: '#FFF9F7',
    fontSize: 13.5,
    fontWeight: '700',
  },
  acceptCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangupCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EF4444',
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#2A1621',
    borderTopWidth: 1,
    borderTopColor: '#FF3B6B',
  },
  cancelRecBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248,113,113,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
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
  micButton: {
    backgroundColor: COLORS.primaryRose,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
