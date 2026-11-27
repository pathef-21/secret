import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { FadeSlideIn, FloatingHeartsBurst } from '../../src/components/RomanticAnimations';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

const GAME_EMOJI = {
  truth_or_dare: '🔥',
  guess_my_answer: '🔮',
  would_you_rather: '⚖️',
  most_likely_to: '👀',
  never_have_i_ever: '🙈',
  this_or_that: '⚡',
  couple_quiz: '❤️',
  who_knows_better: '🧠',
  deep_questions: '🌙',
  romantic_challenges: '✨',
  complete_sentence: '✍️',
  spicy_couples: '🌶️',
};

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
  const [celebrateKey, setCelebrateKey] = useState(0);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/games/sessions/');
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch {}
  }, []);

  const fetchGames = useCallback(async () => {
    try {
      const res = await api.get('/games/list/');
      setGamesList(Array.isArray(res.data) ? res.data : []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchGames, fetchSessions]);

  const groupedAnswers = useMemo(() => {
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
        if (ans.created_at > entry.latestAt) entry.latestAt = ans.created_at;
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.latestAt || '').localeCompare(a.latestAt || ''));
  }, [sessions]);

  const unansweredFromPartner = useMemo(() => {
    return groupedAnswers.filter(
      (g) =>
        g.answers.some((a) => String(a.user?.id) !== String(user?.id)) &&
        !g.answers.some((a) => String(a.user?.id) === String(user?.id))
    ).length;
  }, [groupedAnswers, user]);

  const openGameModal = async (game) => {
    setSelectedGame(game);
    setFetchingQuestion(true);
    setAnswerText('');
    setPartnerGuess('');
    setFeedbackMsg('');

    try {
      const existing = sessions.find((s) => s.game_type === game.id);
      if (existing) {
        setActiveSession(existing);
      } else {
        const sessionRes = await api.post('/games/sessions/', { game_type: game.id });
        setActiveSession(sessionRes.data);
      }
      const qRes = await api.get(`/games/question/${game.id}/`);
      setCurrentQuestion(qRes.data);
    } catch {
      setSelectedGame(null);
    } finally {
      setFetchingQuestion(false);
    }
  };

  const openQuickRandomGame = () => {
    if (!gamesList.length) return;
    const randomGame = gamesList[Math.floor(Math.random() * gamesList.length)];
    openGameModal(randomGame);
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
    } catch {
      setFeedbackMsg('Impossible de charger une autre question.');
    } finally {
      setFetchingQuestion(false);
    }
  };

  const submitAnswer = async (selectedOption = null) => {
    const finalAnswer = selectedOption || answerText.trim();
    if (!finalAnswer) {
      setFeedbackMsg('Écris ta réponse d’abord.');
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
      setCelebrateKey((k) => k + 1);
      setFeedbackMsg('✅ Réponse envoyée !');
      setAnswerText('');
      setPartnerGuess('');
      setTimeout(() => {
        nextQuestion();
      }, 900);
    } catch {
      setFeedbackMsg('Erreur lors de l’envoi.');
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Simple Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Jeux à Deux 🇸🇳❤️</Text>
          <Text style={styles.subtitle}>Choisis un jeu ou lance une question rapide</Text>
        </View>

        {/* Simple 2-Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'games' && styles.tabBtnActive]}
            onPress={() => setActiveTab('games')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'games' && styles.tabBtnTextActive]}>
              🎲 Jouer
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
              💌 Réponses ({groupedAnswers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'games' ? (
          <>
            {/* 1-Tap Quick Play Button */}
            <TouchableOpacity style={styles.quickPlayBtn} onPress={openQuickRandomGame} activeOpacity={0.85}>
              <Text style={styles.quickPlayEmoji}>🎲</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickPlayTitle}>Question rapide au hasard</Text>
                <Text style={styles.quickPlaySub}>1 clic pour jouer tout de suite</Text>
              </View>
              <Ionicons name="play-circle" size={30} color={COLORS.deepBlack} />
            </TouchableOpacity>

            {/* Partner waiting banner */}
            {unansweredFromPartner > 0 && (
              <TouchableOpacity style={styles.partnerBanner} onPress={() => setActiveTab('answers')}>
                <Text style={styles.partnerBannerText}>
                  💌 {unansweredFromPartner} question(s) de ton Bae t’attendent →
                </Text>
              </TouchableOpacity>
            )}

            {/* Clean 2-Column Compact Grid */}
            <View style={styles.gridTwoCol}>
              {gamesList.map((game, idx) => (
                <FadeSlideIn key={game.id} delay={Math.min(idx * 40, 280)} style={styles.tileWrap}>
                  <TouchableOpacity
                    style={styles.gameTile}
                    onPress={() => openGameModal(game)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tileEmoji}>{GAME_EMOJI[game.id] || '❤️'}</Text>
                    <Text style={styles.tileTitle} numberOfLines={2}>
                      {game.title}
                    </Text>
                  </TouchableOpacity>
                </FadeSlideIn>
              ))}
            </View>
          </>
        ) : (
          /* Clean Shared Answers List */
          <View style={{ gap: 12 }}>
            {groupedAnswers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>🎲</Text>
                <Text style={styles.emptyTitle}>Aucune réponse encore</Text>
                <Text style={styles.emptySub}>Lance une question dans « Jouer » pour commencer !</Text>
              </View>
            ) : (
              groupedAnswers.map((group) => {
                const iAnswered = group.answers.some((a) => String(a.user?.id) === String(user?.id));
                return (
                  <View key={group.key} style={styles.answerCard}>
                    <Text style={styles.answerGameBadge}>
                      {GAME_EMOJI[group.gameType] || '❤️'} {group.gameTitle}
                    </Text>
                    <Text style={styles.answerQuestion}>
                      « {group.question?.question_text || 'Question'} »
                    </Text>

                    <View style={{ gap: 8, marginTop: 10 }}>
                      {group.answers.map((ans) => {
                        const isMe = String(ans.user?.id) === String(user?.id);
                        const authorName =
                          ans.user?.profile?.nickname || ans.user?.first_name || ans.user?.username || 'Bae';
                        const isHiddenSecret = group.gameType === 'guess_my_answer' && !isMe && !iAnswered;
                        return (
                          <View
                            key={String(ans.id)}
                            style={[styles.singleAnswerBox, isMe ? styles.myAnswerBox : styles.partnerAnswerBox]}
                          >
                            <Text style={[styles.authorLabel, isMe ? { color: COLORS.primaryRose } : { color: '#A78BFA' }]}>
                              {isMe ? 'Moi' : `❤️ ${authorName}`}
                            </Text>
                            {isHiddenSecret ? (
                              <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontStyle: 'italic' }}>
                                🔒 Caché ! Réponds d’abord pour voir sa réponse.
                              </Text>
                            ) : (
                              <>
                                <Text style={styles.answerContent}>{ans.answer_text}</Text>
                                {!!ans.partner_guess && (
                                  <Text style={styles.guessContent}>🔮 Devait deviner : {ans.partner_guess}</Text>
                                )}
                              </>
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
                        <Text style={styles.replyBtnText}>Répondre 💬</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Clean Simple Question Modal */}
      <Modal visible={!!selectedGame} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalGameType}>
                {GAME_EMOJI[selectedGame?.id] || '❤️'} {selectedGame?.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedGame(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {!!feedbackMsg && (
              <Text
                style={{
                  color: feedbackMsg.startsWith('✅') ? '#4ADE80' : '#FCA5A5',
                  fontSize: 13.5,
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 10,
                }}
              >
                {feedbackMsg}
              </Text>
            )}

            {fetchingQuestion ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.primaryRose} />
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
                    <TextInput
                      style={styles.textInput}
                      placeholder="Écris ta réponse ici..."
                      placeholderTextColor={COLORS.textMuted}
                      value={answerText}
                      onChangeText={setAnswerText}
                      multiline
                    />

                    {selectedGame?.id === 'guess_my_answer' && (
                      <TextInput
                        style={styles.textInput}
                        placeholder="Et que penses-tu que ton Bae va répondre ?"
                        placeholderTextColor={COLORS.textMuted}
                        value={partnerGuess}
                        onChangeText={setPartnerGuess}
                      />
                    )}

                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={() => submitAnswer()}
                      disabled={submitting || !answerText.trim()}
                    >
                      {submitting ? (
                        <ActivityIndicator color={COLORS.deepBlack} />
                      ) : (
                        <Text style={styles.submitBtnText}>Envoyer ❤️ </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={styles.skipBtn} onPress={nextQuestion}>
                  <Text style={styles.skipBtnText}>Autre question →</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <FloatingHeartsBurst triggerKey={celebrateKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deepBlack },
  scrollContent: { padding: 18, paddingTop: 54, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deepBlack },
  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primaryRose },
  subtitle: { fontSize: 13.5, color: COLORS.textSecondary, marginTop: 3 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabBtnActive: { backgroundColor: COLORS.primaryRose },
  tabBtnText: { color: COLORS.textSecondary, fontSize: 13.5, fontWeight: '700' },
  tabBtnTextActive: { color: COLORS.deepBlack },
  quickPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryRose,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    gap: 12,
  },
  quickPlayEmoji: { fontSize: 26 },
  quickPlayTitle: { color: COLORS.deepBlack, fontSize: 15, fontWeight: '800' },
  quickPlaySub: { color: 'rgba(23,21,28,0.75)', fontSize: 12, fontWeight: '600' },
  partnerBanner: {
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
    borderColor: '#A78BFA',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  partnerBannerText: { color: '#FFF9F7', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  gridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tileWrap: {
    width: '48%',
  },
  gameTile: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tileEmoji: { fontSize: 30, marginBottom: 8 },
  tileTitle: { color: COLORS.textPrimary, fontSize: 13.5, fontWeight: '700', textAlign: 'center' },
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  answerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  answerGameBadge: { color: COLORS.primaryRose, fontSize: 11.5, fontWeight: '800', marginBottom: 6 },
  answerQuestion: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  singleAnswerBox: { borderRadius: 12, padding: 11, borderWidth: 1 },
  myAnswerBox: { backgroundColor: 'rgba(242,167,198,0.08)', borderColor: 'rgba(242,167,198,0.25)' },
  partnerAnswerBox: { backgroundColor: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.35)' },
  authorLabel: { fontSize: 12, fontWeight: '800', marginBottom: 3 },
  answerContent: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 19 },
  guessContent: { color: COLORS.textSecondary, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  replyBtn: { backgroundColor: COLORS.primaryRose, borderRadius: 12, paddingVertical: 9, alignItems: 'center', marginTop: 10 },
  replyBtnText: { color: COLORS.deepBlack, fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalGameType: { fontSize: 18, fontWeight: '800', color: COLORS.primaryRose, flex: 1 },
  closeBtn: { padding: 4 },
  modalLoading: { paddingVertical: 40, alignItems: 'center' },
  questionBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryRose,
  },
  questionText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 24, textAlign: 'center' },
  optionsList: { gap: 10, marginBottom: 12 },
  optionButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  optionText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  freeFormAnswer: { marginBottom: 10 },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    minHeight: 54,
    marginBottom: 12,
  },
  submitBtn: { backgroundColor: COLORS.primaryRose, borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: COLORS.deepBlack, fontSize: 15, fontWeight: '800' },
  skipBtn: { paddingVertical: 12, alignItems: 'center' },
  skipBtnText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
});
