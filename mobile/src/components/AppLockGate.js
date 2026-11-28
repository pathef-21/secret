import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  AppState,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  isAppLockEnabled,
  verifyAppLockPassword,
  disableAppLock,
  subscribeAppLock,
} from '../services/appLock';
import { COLORS } from '../theme/colors';

const RELOCK_AFTER_MS = 20000; // Re-lock if app stays in background > 20s

export default function AppLockGate() {
  const { user, logout } = useAuth();
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const backgroundAtRef = useRef(null);
  const enabledRef = useRef(false);

  // Check initial lock state when user is logged in
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!user) {
        if (active) {
          enabledRef.current = false;
          setLocked(false);
          setChecking(false);
        }
        return;
      }
      const enabled = await isAppLockEnabled();
      if (active) {
        enabledRef.current = enabled;
        setLocked(enabled);
        setChecking(false);
      }
    };
    init();

    const unsub = subscribeAppLock(async (event) => {
      const enabled = await isAppLockEnabled();
      enabledRef.current = enabled;
      if (!enabled) {
        setLocked(false);
        setPasscode('');
        setError('');
      } else if (event === 'lock') {
        setPasscode('');
        setError('');
        setLocked(true);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [user]);

  // Auto-relock when returning from background (Web PWA + Native)
  useEffect(() => {
    if (!user) return;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onVisChange = () => {
        if (document.hidden) {
          backgroundAtRef.current = Date.now();
        } else if (enabledRef.current && backgroundAtRef.current) {
          const awayMs = Date.now() - backgroundAtRef.current;
          backgroundAtRef.current = null;
          if (awayMs >= RELOCK_AFTER_MS) {
            setPasscode('');
            setError('');
            setLocked(true);
          }
        }
      };
      document.addEventListener('visibilitychange', onVisChange);
      return () => document.removeEventListener('visibilitychange', onVisChange);
    }

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundAtRef.current = Date.now();
      } else if (nextState === 'active' && enabledRef.current && backgroundAtRef.current) {
        const awayMs = Date.now() - backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (awayMs >= RELOCK_AFTER_MS) {
          setPasscode('');
          setError('');
          setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, [user]);

  const handleUnlock = async () => {
    setError('');
    if (!passcode.trim()) {
      setError('Veuillez saisir votre mot de passe de sécurité.');
      return;
    }
    const ok = await verifyAppLockPassword(passcode);
    if (ok) {
      setPasscode('');
      setError('');
      setAttempts(0);
      setLocked(false);
    } else {
      setAttempts((a) => a + 1);
      setError('Mot de passe de sécurité incorrect.');
      setPasscode('');
    }
  };

  const handleForgotAndLogout = async () => {
    await disableAppLock();
    setLocked(false);
    setPasscode('');
    setError('');
    await logout();
  };

  if (checking || !user || !locked) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <View style={styles.card}>
          <View style={styles.lockIconWrap}>
            <Ionicons name="lock-closed" size={34} color={COLORS.deepBlack} />
          </View>
          <Text style={styles.brand}>Man Ak Bae ❤️</Text>
          <Text style={styles.title}>Espace Privé Verrouillé</Text>
          <Text style={styles.subtitle}>
            Entrez votre mot de passe de sécurité pour accéder à votre espace à deux.
          </Text>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={passcode}
              onChangeText={(t) => {
                setPasscode(t);
                if (error) setError('');
              }}
              placeholder="Mot de passe de sécurité"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPass}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleUnlock}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPass((v) => !v)}
            >
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock} activeOpacity={0.85}>
            <Ionicons name="lock-open-outline" size={18} color={COLORS.deepBlack} style={{ marginRight: 8 }} />
            <Text style={styles.unlockBtnText}>Déverrouiller</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotAndLogout}>
            <Text style={styles.forgotText}>
              {attempts >= 2
                ? 'Mot de passe oublié ? Se déconnecter pour réinitialiser'
                : 'Se déconnecter du compte'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.deepBlack,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inner: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242, 167, 198, 0.3)',
  },
  lockIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryRose,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryRose,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    height: 52,
    justifyContent: 'center',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  unlockBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primaryRose,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  unlockBtnText: {
    color: COLORS.deepBlack,
    fontSize: 16,
    fontWeight: '800',
  },
  forgotBtn: {
    marginTop: 18,
    paddingVertical: 6,
  },
  forgotText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
