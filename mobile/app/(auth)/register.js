import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    setErrorMessage('');
    if (!username.trim() || !email.trim() || !password || !passwordConfirm) {
      const msg = 'Veuillez remplir tous les champs obligatoires.';
      setErrorMessage(msg);
      if (Platform.OS !== 'web') Alert.alert('Champs incomplets', msg);
      return;
    }

    if (password !== passwordConfirm) {
      const msg = 'Les deux mots de passe ne correspondent pas.';
      setErrorMessage(msg);
      if (Platform.OS !== 'web') Alert.alert('Erreur', msg);
      return;
    }

    if (password.length < 8) {
      const msg = 'Le mot de passe doit comporter au moins 8 caractères.';
      setErrorMessage(msg);
      if (Platform.OS !== 'web') Alert.alert('Mot de passe trop court', msg);
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirm: passwordConfirm,
        nickname: nickname.trim() || username.trim(),
      });
      // Redirect will be handled automatically by RootLayoutNav
    } catch (error) {
      const errorData = error.response?.data;
      let msg = 'Une erreur est survenue lors de l’inscription.';
      if (errorData) {
        if (typeof errorData === 'string') msg = errorData;
        else if (errorData.email) msg = `Email: ${errorData.email[0]}`;
        else if (errorData.username) msg = `Nom d’utilisateur: ${errorData.username[0]}`;
        else if (errorData.password) msg = `Mot de passe: ${errorData.password[0]}`;
        else if (errorData.detail) msg = errorData.detail;
      } else if (error.code === 'ECONNABORTED') {
        msg = 'Le serveur se réveille, réessayez dans quelques secondes.';
      }
      setErrorMessage(msg);
      if (Platform.OS !== 'web') Alert.alert('Inscription impossible', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.heartIcon}>✨</Text>
          <Text style={styles.title}>Rejoignez Man Ak Bae</Text>
          <Text style={styles.subtitle}>Créez votre profil pour commencer votre aventure à deux</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formCard}>
          {!!errorMessage && (
            <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <Text style={{ color: '#fca5a5', fontSize: 13 }}>{errorMessage}</Text>
            </View>
          )}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.primaryRose} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="heart-outline" size={20} color={COLORS.primaryRose} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Votre surnom d'amour (ex: Mon Bae)"
              placeholderTextColor={COLORS.textMuted}
              value={nickname}
              onChangeText={setNickname}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primaryRose} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primaryRose} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe (8+ caractères)"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primaryRose} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
            />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.deepBlack} />
            ) : (
              <Text style={styles.registerButtonText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepBlack,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  heartIcon: {
    fontSize: 40,
    marginBottom: 8,
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
    marginTop: 6,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  registerButton: {
    backgroundColor: COLORS.primaryRose,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: COLORS.deepBlack,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primaryRose,
    fontSize: 14,
    fontWeight: '700',
  },
});

