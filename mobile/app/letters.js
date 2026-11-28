import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import { COLORS } from '../src/theme/colors';

export default function LettersScreen() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create letter modal
  const [createModal, setCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [banner, setBanner] = useState(null); // { type: 'info' | 'success' | 'error', text }

  // Read letter modal
  const [openedLetter, setOpenedLetter] = useState(null);

  const showBanner = (text, type = 'info') => {
    setBanner({ text, type });
    setTimeout(() => setBanner((prev) => (prev?.text === text ? null : prev)), 4500);
  };

  const fetchLetters = useCallback(async () => {
    try {
      const res = await api.get('/surprises/letters/');
      setLetters(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (e) {
      console.warn('Failed to fetch letters:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  const handleCreateLetter = async () => {
    setModalError('');
    if (!title.trim() || !content.trim()) {
      const msg = 'Veuillez écrire votre lettre et son titre.';
      setModalError(msg);
      if (Platform.OS !== 'web') Alert.alert('Champs requis', msg);
      return;
    }

    setSubmitting(true);
    const payload = {
      title: title.trim(),
      content: content.trim(),
    };
    if (unlockDate.trim()) {
      payload.unlock_at = `${unlockDate.trim()}T00:00:00Z`;
    }

    try {
      await api.post('/surprises/letters/', payload);
      setCreateModal(false);
      setTitle('');
      setContent('');
      setUnlockDate('');
      setModalError('');
      fetchLetters();
      const okMsg = 'Votre lettre a été scellée avec amour pour votre partenaire. 💌';
      showBanner(okMsg, 'success');
      if (Platform.OS !== 'web') Alert.alert('Envoyée ! 💌', okMsg);
    } catch (e) {
      const errData = e?.response?.data;
      const msg =
        errData?.detail ||
        errData?.unlock_at?.[0] ||
        'Impossible d’envoyer la lettre.';
      setModalError(msg);
      if (Platform.OS !== 'web') Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenLetter = async (letter) => {
    if (!letter.is_unlocked && letter.content_masked) {
      const msg = `Lettre scellée 🔒 : ouverture prévue le ${new Date(letter.unlock_at).toLocaleDateString('fr-FR')}. Patience mon cœur ! ❤️`;
      showBanner(msg, 'info');
      if (Platform.OS !== 'web') Alert.alert('Lettre Scellée 🔒', msg);
      return;
    }

    try {
      const res = await api.post(`/surprises/letters/${letter.id}/open/`);
      setOpenedLetter(res.data);
      fetchLetters();
    } catch {
      setOpenedLetter(letter);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryRose} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.topCard}>
        <Text style={styles.topCardEmoji}>💌</Text>
        <Text style={styles.topCardTitle}>Boîte aux Lettres Secrètes</Text>
        <Text style={styles.topCardSubtitle}>
          Écrivez des déclarations intemporelles et programmez leur découverte pour une date magique.
        </Text>
        <TouchableOpacity style={styles.writeButton} onPress={() => setCreateModal(true)}>
          <Ionicons name="pencil" size={16} color={COLORS.deepBlack} style={{ marginRight: 6 }} />
          <Text style={styles.writeButtonText}>Écrire une lettre d'amour</Text>
        </TouchableOpacity>
      </View>

      {/* Banner feedback (web & mobile) */}
      {!!banner && (
        <View
          style={{
            marginHorizontal: 18,
            marginBottom: 10,
            padding: 12,
            borderRadius: 14,
            backgroundColor:
              banner.type === 'success'
                ? 'rgba(74, 222, 128, 0.14)'
                : 'rgba(242, 167, 198, 0.14)',
            borderWidth: 1,
            borderColor: banner.type === 'success' ? '#4ADE80' : COLORS.primaryRose,
          }}
        >
          <Text style={{ color: COLORS.textPrimary, fontSize: 13, textAlign: 'center', fontWeight: '600' }}>
            {banner.text}
          </Text>
        </View>
      )}

      {/* Letters List */}
      <FlatList
        data={letters}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isLocked = !item.is_unlocked && item.content_masked;
          return (
            <TouchableOpacity
              style={[styles.letterCard, isLocked && styles.lockedCard]}
              onPress={() => handleOpenLetter(item)}
              activeOpacity={0.8}
            >
              <View style={styles.letterHeader}>
                <View style={styles.sealCircle}>
                  <Text style={styles.sealEmoji}>{isLocked ? '🔒' : '💌'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.letterTitle}>{item.title}</Text>
                  <Text style={styles.letterMeta}>
                    Par {item.sender.username} • {new Date(item.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                {item.is_opened && !isLocked && (
                  <View style={styles.readBadge}>
                    <Text style={styles.readBadgeText}>Lue</Text>
                  </View>
                )}
              </View>

              <Text style={styles.letterSnippet} numberOfLines={2}>
                {item.content}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📜</Text>
            <Text style={styles.emptyTitle}>Votre boîte est vide</Text>
            <Text style={styles.emptySubtitle}>Surprenez votre partenaire avec une belle lettre !</Text>
          </View>
        }
      />

      {/* Write Letter Modal */}
      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle Lettre ✍️</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!!modalError && (
                <View style={{ backgroundColor: 'rgba(239,68,68,0.16)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 14 }}>
                  <Text style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>{modalError}</Text>
                </View>
              )}
              <Text style={styles.inputLabel}>Titre de la lettre</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Ce que j'ai sur le cœur..."
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Date de déverrouillage (YYYY-MM-DD, optionnel)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Laissez vide pour lecture immédiate"
                placeholderTextColor={COLORS.textMuted}
                value={unlockDate}
                onChangeText={setUnlockDate}
              />

              <Text style={styles.inputLabel}>Votre lettre d'amour</Text>
              <TextInput
                style={[styles.textInput, styles.letterBodyInput]}
                placeholder="Mon amour, aujourd'hui j'avais envie de te dire..."
                placeholderTextColor={COLORS.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
              />

              <TouchableOpacity
                style={styles.sendLetterBtn}
                onPress={handleCreateLetter}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.deepBlack} />
                ) : (
                  <Text style={styles.sendLetterBtnText}>Sceller et Envoyer la lettre ❤️</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Read Letter Modal */}
      <Modal visible={!!openedLetter} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.parchmentContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.parchmentTitle}>{openedLetter?.title}</Text>
              <TouchableOpacity onPress={() => setOpenedLetter(null)}>
                <Ionicons name="close" size={24} color={COLORS.deepBlack} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.parchmentScroll}>
              <Text style={styles.parchmentMeta}>
                Écrite avec passion par {openedLetter?.sender?.username}
              </Text>
              <Text style={styles.parchmentBody}>{openedLetter?.content}</Text>
              <Text style={styles.parchmentSignature}>Pour toujours, Man Ak Bae ❤️</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: COLORS.deepBlack,
  },
  topCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 22,
    margin: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  topCardEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  topCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryRose,
    marginBottom: 4,
  },
  topCardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  writeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryRose,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  writeButtonText: {
    color: COLORS.deepBlack,
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 12,
  },
  letterCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  lockedCard: {
    opacity: 0.8,
    borderColor: 'rgba(242, 167, 198, 0.4)',
  },
  letterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sealCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(242, 167, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sealEmoji: {
    fontSize: 20,
  },
  letterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  letterMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  readBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  readBadgeText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
  letterSnippet: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryRose,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  letterBodyInput: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  sendLetterBtn: {
    backgroundColor: COLORS.primaryRose,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  sendLetterBtnText: {
    color: COLORS.deepBlack,
    fontSize: 15,
    fontWeight: '700',
  },
  parchmentContent: {
    backgroundColor: COLORS.offWhite,
    maxHeight: '80%',
  },
  parchmentScroll: {
    paddingVertical: 10,
  },
  parchmentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.deepBlack,
  },
  parchmentMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  parchmentBody: {
    fontSize: 16,
    color: '#222',
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  parchmentSignature: {
    marginTop: 30,
    fontSize: 14,
    color: '#444',
    textAlign: 'right',
    fontStyle: 'italic',
    fontWeight: '700',
  },
});

