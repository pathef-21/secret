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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

export default function GamesScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('games'); // 'games' | 'answers'
  const [gamesList, setGamesList] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [fetchingQuestion, setFetchingQuestion] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [partnerGuess, setPartnerGuess] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/games/sessions/');
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn('Failed to fetch game sessions:', e);
    }
  }, []);

  const fetchGames = useCallback(async () => {
    try {
      const res = await api.get('/games/list/');
      setGamesList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn('Failed to fetch games:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchGames, fetchSessions]);

  // Flatten & group all answers from the couple's sessions by question
  const groupedAnswers = React.useMemo(() => {
    const map = new Map();
    for (const sess of sessions) {
      for (const ans of sess.answers || []) {
        const qId = ans.question?.id || ans.id;
        const key = `${sess.id}_${qId}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            sessionId: sess.id,
            gameType: sess.game_type,
            gameTitle: sess.game_type_display || sess.game_type,
            question: ans.question,
            answers: [],
            latestAt: ans.created_at,
          });
        }
        const entry = map.get(key);
        entry.answers.push(ans);
        if (ans.created_at > entry.latestAt) {
          entry.latestAt = ans.created_at;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.latestAt || '').localeCompare(a.latestAt || ''));
  }, [sessions]);

  const partnerAnswersCount = React.useMemo(() => {
    return groupedAnswers.filter((g) => g.answers.some((a) => a.user?.id !== user?.id)).length;
  }, [groupedAnswers, user]);

  const openGameModal = async (game) => {
    setSelectedGame(game);
    setFetchingQuestion(true);
    setAnswerText('');
    setPartnerGuess('');
    setFeedbackMsg('');

    try {
      // Reuse latest session of same game_type if available so partner answers stay grouped
      const existing = sessions.find((s) => s.game_type === game.id);
      if (existing) {
        setActiveSession(existing);
      } else {
        const sessionRes = await api.post('/games/sessions/', { game_type: game.id });
        setActiveSession(sessionRes.data);
      }

      const qRes = await api.get(`/games/question/${game.id}/`);
      setCurrentQuestion(qRes.data);
    } catch (e) {
      if (Platform.OS !== 'web') Alert.alert('Erreur', 'Impossible de charger la question pour ce jeu.');
      setSelectedGame(null);
    } finally {
      setFetchingQuestion(false);
    }
  };

  const openReplyToPartnerQuestion = (group) => {
    const gameMeta = gamesList.find((g) => g.id === group.gameType) || {
      id: group.gameType,
      title: group.gameTitle,
    };
    setSelectedGame(gameMeta);
    setActiveSession({ id: group.sessionId, game_type: group.gameType });
    setCurrentQuestion(group.question);
    setAnswerText('');
    setPartnerGuess('');
    setFeedbackMsg('');
    setFetchingQuestion(false);
  };

  const nextQuestion = async () => {
    if (!selectedGame) return;
    setFetchingQuestion(true);
    setAnswerText('');
    setPartnerGuess('');
    setFeedbackMsg('');
    try {
      const qRes = await api.get(`/games/question/${selectedGame.id}/`);
      setCurrentQuestion(qRes.data);
    } catch (e) {
      setFeedbackMsg('Impossible de tirer une nouvelle question.');
    } finally {
      setFetchingQuestion(false);
    }
  };

  const submitAnswer = async (selectedOption = null) => {
    const finalAnswer = selectedOption || answerText.trim();
    if (!finalAnswer) {
      setFeedbackMsg('Veuillez saisir votre réponse.');
      return;
    }

    setSubmitting(true);
    setFeedbackMsg('');
    try {
      await api.post(`/games/sessions/${activeSession.id}/answer/`, {
        question_id: currentQuestion.id,
        answer_text: finalAnswer,
        partner_guess: partnerGuess.trim(),
      });
      await fetchSessions();
      setFeedbackMsg('✅ Réponse envoyée ! Ton/ta partenaire peut la voir dans « Nos Réponses » ❤️');
      setAnswerText('');
      setPartnerGuess('');
      if (Platform.OS !== 'web') {
        Alert.alert('Enregistré ! ❤️', 'Votre réponse a été partagée avec votre partenaire.');
      }
      setTimeout(() => {
        nextQuestion();
      }, 1200);
    } catch (e) {
      setFeedbackMsg('Échec de l’envoi de votre réponse.');
      if (Platform.OS !== 'web') Alert.alert('Erreur', 'Échec de l’envoi de votre réponse.');
    } finally {
      setSubmitting(false);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Jeux Pour Deux ❤️</Text>
        <Text style={styles.subtitle}>
          Riez, confiez-vous et découvrez les réponses de votre moitié
        </Text>
      </View>

      {/* Switcher Jeux / Nos Réponses */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'games' && styles.tabBtnActive]}
          onPress={() => setActiveTab('games')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'games' && styles.tabBtnTextActive]}>
            🎲 Jeux ({gamesList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'answers' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('answers');
            fetchSessions();
          }}
        >
          <Text style={[styles.tabBtnText, activeTab === 'answers' && styles.tabBtnTextActive]}>
            💌 Nos Réponses ({groupedAnswers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'games' ? (
        <>
          {partnerAnswersCount > 0 && (
            <TouchableOpacity
              style={styles.partnerBanner}
              onPress={() => setActiveTab('answers')}
              activeOpacity={0.85}
            >
              <Text style={styles.partnerBannerText}>
                💌 Ton/ta partenaire a répondu à {partnerAnswersCount} question(s) ! Voir →
              </Text>
            </TouchableOpacity>
          )}

          {/* Grid of Games */}
          <View style={styles.grid}>
            {gamesList.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => openGameModal(game)}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={game.icon || 'heart-outline'} size={28} color={COLORS.primaryRose} />
                </View>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameDescription} numberOfLines={2}>
                  {game.description}
                </Text>
                <View style={styles.playPill}>
                  <Text style={styles.playText}>Jouer ensemble</Text>
                  <Ionicons name="arrow-forward" size={12} color={COLORS.deepBlack} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        /* Shared Couple Answers History */
        <View style={{ gap: 14 }}>
          {groupedAnswers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🎲</Text>
              <Text style={styles.emptyTitle}>Aucune réponse pour le moment</Text>
              <Text style={styles.emptySub}>
                Lance un jeu dans l’onglet « Jeux » : tes réponses et celles de ton/ta partenaire apparaîtront ici en direct !
              </Text>
            </View>
          ) : (
            groupedAnswers.map((group) => {
              const iAnswered = group.answers.some((a) => a.user?.id === user?.id);
              return (
                <View key={group.key} style={styles.answerCard}>
                  <View style={styles.answerCardHeader}>
                    <Text style={styles.answerGameBadge}>{group.gameTitle}</Text>
                    <Text style={styles.answerDate}>
                      {new Date(group.latestAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <Text style={styles.answerQuestion}>
                    « {group.question?.question_text || 'Question'} »
                  </Text>

                  <View style={{ gap: 10, marginTop: 12 }}>
                    {group.answers.map((ans) => {
                      const isMe = ans.user?.id === user?.id;
                      const authorName =
                        ans.user?.profile?.nickname || ans.user?.first_name || ans.user?.username || 'Partenaire';
                      return (
                        <View
                          key={String(ans.id)}
                          style={[
                            styles.singleAnswerBox,
                            isMe ? styles.myAnswerBox : styles.partnerAnswerBox,
                          ]}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={[styles.authorLabel, isMe ? { color: COLORS.primaryRose } : { color: '#A78BFA' }]}>
                              {isMe ? `Moi (${authorName})` : `❤️ ${authorName}`}
                            </Text>
                            {ans.is_matched && (
                              <Text style={{ color: '#4ADE80', fontSize: 11, fontWeight: '800' }}>✨ Match !</Text>
                            )}
                          </View>
                          <Text style={styles.answerContent}>{ans.answer_text}</Text>
                          {!!ans.partner_guess && (
                            <Text style={styles.guessContent}>
                              🔮 Pensait que l’autre répondrait : « {ans.partner_guess} »
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {!iAnswered && (
                    <TouchableOpacity
                      style={styles.replyBtn}
                      onPress={() => openReplyToPartnerQuestion(group)}
                    >
                      <Text style={styles.replyBtnText}>Répondre aussi à cette question 💬</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Interactive Game Modal */}
      <Modal visible={!!selectedGame} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalGameType}>{selectedGame?.title}</Text>
                <Text style={styles.modalCategory}>
                  Catégorie : {currentQuestion?.category || 'Amour'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedGame(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {!!feedbackMsg && (
              <View
                style={{
                  backgroundColor: feedbackMsg.startsWith('✅')
                    ? 'rgba(74,222,128,0.15)'
                    : 'rgba(239,68,68,0.15)',
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: feedbackMsg.startsWith('✅') ? '#86efac' : '#fca5a5',
                    fontSize: 13,
                    textAlign: 'center',
                    fontWeight: '600',
                  }}
                >
                  {feedbackMsg}
                </Text>
              </View>
            )}

            {fetchingQuestion ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.primaryRose} />
                <Text style={styles.loadingText}>Tirage d’une question complice...</Text>
              </View>
            ) : currentQuestion ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.questionBox}>
                  <Text style={styles.questionText}>« {currentQuestion.question_text} »</Text>
                </View>

                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                  <View style={styles.optionsList}>
                    {currentQuestion.options.map((opt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.optionButton}
                        onPress={() => submitAnswer(opt)}
                        disabled={submitting}
                      >
                        <Text style={styles.optionText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.freeFormAnswer}>
                    <Text style={styles.inputLabel}>Ta réponse :</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Écris ce que tu penses sincèrement..."
                      placeholderTextColor={COLORS.textMuted}
                      value={answerText}
                      onChangeText={setAnswerText}
                      multiline
                    />

                    {selectedGame?.id === 'guess_my_answer' && (
                      <>
                        <Text style={styles.inputLabel}>Ce que tu penses que ton Bae répondra :</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Devine sa réponse..."
                          placeholderTextColor={COLORS.textMuted}
                          value={partnerGuess}
                          onChangeText={setPartnerGuess}
                        />
                      </>
                    )}

                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={() => submitAnswer()}
                      disabled={submitting || !answerText.trim()}
                    >
                      {submitting ? (
                        <ActivityIndicator color={COLORS.deepBlack} />
                      ) : (
                        <Text style={styles.submitBtnText}>Valider ma réponse</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={styles.skipBtn} onPress={nextQuestion}>
                  <Text style={styles.skipBtnText}>Passer à une autre question 🎲</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepBlack,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.deepBlack,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryRose,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primaryRose,
  },
  tabBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: COLORS.deepBlack,
  },
  partnerBanner: {
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
    borderColor: '#A78BFA',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  partnerBannerText: {
    color: '#FFF9F7',
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    gap: 14,
  },
  gameCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(242, 167, 198, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  gameDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  playPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryRose,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  playText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.deepBlack,
  },
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  answerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  answerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerGameBadge: {
    color: COLORS.primaryRose,
    fontSize: 11.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  answerDate: {
    color: COLORS.textMuted,
    fontSize: 11.5,
  },
  answerQuestion: {
    color: COLORS.textPrimary,
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 22,
  },
  singleAnswerBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  myAnswerBox: {
    backgroundColor: 'rgba(242, 167, 198, 0.08)',
    borderColor: 'rgba(242, 167, 198, 0.25)',
  },
  partnerAnswerBox: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  authorLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  answerContent: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    lineHeight: 20,
  },
  guessContent: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  replyBtn: {
    backgroundColor: COLORS.primaryRose,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  replyBtnText: {
    color: COLORS.deepBlack,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalGameType: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryRose,
  },
  modalCategory: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalLoading: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  questionBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryRose,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 26,
    textAlign: 'center',
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  freeFormAnswer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    minHeight: 60,
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: COLORS.primaryRose,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: COLORS.deepBlack,
    fontSize: 15,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
