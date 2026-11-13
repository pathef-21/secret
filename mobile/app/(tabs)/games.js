import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { COLORS } from '../../src/theme/colors';

export default function GamesScreen() {
  const [gamesList, setGamesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [fetchingQuestion, setFetchingQuestion] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [partnerGuess, setPartnerGuess] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await api.get('/games/list/');
      setGamesList(res.data);
    } catch (e) {
      console.warn('Failed to fetch games:', e);
    } finally {
      setLoading(false);
    }
  };

  const openGameModal = async (game) => {
    setSelectedGame(game);
    setFetchingQuestion(true);
    setAnswerText('');
    setPartnerGuess('');

    try {
      // 1. Create or join session
      const sessionRes = await api.post('/games/sessions/', { game_type: game.id });
      setActiveSession(sessionRes.data);

      // 2. Fetch random question
      const qRes = await api.get(`/games/question/${game.id}/`);
      setCurrentQuestion(qRes.data);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger la question pour ce jeu.');
      setSelectedGame(null);
    } finally {
      setFetchingQuestion(false);
    }
  };

  const nextQuestion = async () => {
    if (!selectedGame) return;
    setFetchingQuestion(true);
    setAnswerText('');
    setPartnerGuess('');
    try {
      const qRes = await api.get(`/games/question/${selectedGame.id}/`);
      setCurrentQuestion(qRes.data);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de tirer une nouvelle question.');
    } finally {
      setFetchingQuestion(false);
    }
  };

  const submitAnswer = async (selectedOption = null) => {
    const finalAnswer = selectedOption || answerText.trim();
    if (!finalAnswer) {
      Alert.alert('Réponse requise', 'Veuillez saisir votre réponse.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/games/sessions/${activeSession.id}/answer/`, {
        question_id: currentQuestion.id,
        answer_text: finalAnswer,
        partner_guess: partnerGuess.trim(),
      });
      Alert.alert('Enregistré ! ❤️', 'Votre réponse a été enregistrée avec succès.');
      nextQuestion();
    } catch (e) {
      Alert.alert('Erreur', 'Échec de l’envoi de votre réponse.');
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
          Riez, confiez-vous et testez votre complicité amoureuse
        </Text>
      </View>

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

      {/* Interactive Game Modal */}
      <Modal visible={!!selectedGame} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
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

            {fetchingQuestion ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.primaryRose} />
                <Text style={styles.loadingText}>Tirage d’une question complice...</Text>
              </View>
            ) : currentQuestion ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Question Box */}
                <View style={styles.questionBox}>
                  <Text style={styles.questionText}>« {currentQuestion.question_text} »</Text>
                </View>

                {/* Multiple Choice Options (si Tu préfères quoi ou Quiz) */}
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
                  /* Free Text Answer */
                  <View style={styles.freeFormAnswer}>
                    <Text style={styles.inputLabel}>Ta réponse secrète :</Text>
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
    marginBottom: 24,
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
    marginBottom: 20,
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

