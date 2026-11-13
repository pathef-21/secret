import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

export default function CoupleSetupScreen() {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [coupleName, setCoupleName] = useState('Man Ak Bae ❤️');
  const [startDate, setStartDate] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [loading, setLoading] = useState(false);

  const { refreshCouple, logout } = useAuth();
  const router = useRouter();

  const handleCreateCouple = async () => {
    if (!coupleName.trim()) {
      Alert.alert('Nom requis', 'Veuillez donner un joli nom à votre espace de couple.');
      return;
    }

    setLoading(true);
    try {
      const payload = { name: coupleName.trim() };
      if (startDate.trim()) payload.relationship_start_date = startDate.trim();

      const res = await api.post('/couples/create/', payload);
      setGeneratedInvite({
        code: res.data.invitation_code,
        expiresAt: res.data.invitation_expires_at,
      });
      await refreshCouple();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Impossible de créer le couple.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Code manquant', 'Veuillez saisir le code d’invitation reçu de votre partenaire.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/couples/join/', { code: joinCode.trim() });
      await refreshCouple();
      router.replace('/(tabs)');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Code invalide ou espace déjà complet.';
      Alert.alert('Échec', msg);
    } finally {
      setLoading(false);
    }
  };

  const shareCode = async () => {
    if (!generatedInvite) return;
    try {
      await Share.share({
        message: `Mon amour ❤️ Rejoins notre espace privé sur Man Ak Bae avec mon code d'invitation : ${generatedInvite.code}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heartIcon}>💍</Text>
        <Text style={styles.title}>Votre Espace à Deux</Text>
        <Text style={styles.subtitle}>
          Connectez votre cœur à celui de votre partenaire pour démarrer votre bulle d'intimité.
        </Text>
      </View>

      {/* Onglets Choix */}
      {!generatedInvite && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'create' && styles.activeTabButton]}
            onPress={() => setTab('create')}
          >
            <Text style={[styles.tabText, tab === 'create' && styles.activeTabText]}>Créer un couple</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'join' && styles.activeTabButton]}
            onPress={() => setTab('join')}
          >
            <Text style={[styles.tabText, tab === 'join' && styles.activeTabText]}>Rejoindre mon Bae</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contenu Création */}
      {tab === 'create' && !generatedInvite && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Créer notre espace</Text>
          <Text style={styles.inputLabel}>Nom de votre couple</Text>
          <TextInput
            style={styles.input}
            value={coupleName}
            onChangeText={setCoupleName}
            placeholder="Ex: Abdoulaye & Fatou ❤️"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.inputLabel}>Date de début de relation (YYYY-MM-DD, optionnel)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="Ex: 2023-05-14"
            placeholderTextColor={COLORS.textMuted}
          />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCreateCouple}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.deepBlack} />
            ) : (
              <Text style={styles.actionButtonText}>Créer et générer le code d'invitation</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Invitation Générée */}
      {generatedInvite && (
        <View style={styles.card}>
          <Ionicons name="sparkles" size={32} color={COLORS.primaryRose} style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={styles.cardTitle}>Espace créé avec succès ! 🎉</Text>
          <Text style={styles.cardDescription}>
            Partagez ce code secret unique avec votre partenaire. Dès qu'il l'aura saisi, votre espace privé s'ouvrira pour vous deux.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{generatedInvite.code}</Text>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={shareCode}>
            <Ionicons name="share-social-outline" size={20} color={COLORS.deepBlack} style={{ marginRight: 8 }} />
            <Text style={styles.shareButtonText}>Partager le code à mon partenaire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.continueButtonText}>Accéder à l'application</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contenu Rejoindre */}
      {tab === 'join' && !generatedInvite && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rejoindre mon partenaire</Text>
          <Text style={styles.cardDescription}>
            Entrez le code d'invitation à 8 caractères que votre moitié vous a envoyé.
          </Text>

          <TextInput
            style={[styles.input, styles.codeInput]}
            value={joinCode}
            onChangeText={(text) => setJoinCode(text.toUpperCase())}
            placeholder="CODE..."
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
            maxLength={12}
          />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleJoinCouple}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.deepBlack} />
            ) : (
              <Text style={styles.actionButtonText}>Valider et rejoindre</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton de déconnexion */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 6 }} />
        <Text style={styles.logoutText}>Changer de compte</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.deepBlack,
    padding: 24,
    paddingTop: 56,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heartIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryRose,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: COLORS.primaryRose,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.deepBlack,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    height: 52,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryRose,
    marginVertical: 16,
  },
  codeBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryRose,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryRose,
    letterSpacing: 4,
  },
  actionButton: {
    backgroundColor: COLORS.primaryRose,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: COLORS.deepBlack,
    fontSize: 15,
    fontWeight: '700',
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryRose,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: COLORS.deepBlack,
    fontSize: 15,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  continueButtonText: {
    color: COLORS.primaryRose,
    fontSize: 15,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  logoutText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

