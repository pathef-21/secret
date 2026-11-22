import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api, { appendImageToFormData } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/theme/colors';

export default function ProfileScreen() {
  const { user, couple, logout, refreshUser } = useAuth();
  const [nickname, setNickname] = useState(user?.profile?.nickname || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Notifications toggles
  const [msgNotifs, setMsgNotifs] = useState(true);
  const [flameNotifs, setFlameNotifs] = useState(true);

  // Delete account modal
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const showFeedback = (type, title, text) => {
    setStatusMsg({ type, text });
    if (Platform.OS !== 'web') {
      Alert.alert(title, text);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await api.patch('/auth/profile/', {
        nickname: nickname.trim(),
        bio: bio.trim(),
      });
      await refreshUser();
      showFeedback('success', 'Succès', 'Profil mis à jour ! ❤️');
    } catch {
      showFeedback('error', 'Erreur', 'Impossible de mettre à jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    setStatusMsg({ type: '', text: '' });
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!res.canceled && res.assets[0]) {
      setUploadingAvatar(true);
      try {
        const formData = new FormData();
        await appendImageToFormData(formData, 'avatar', res.assets[0], 'avatar.jpg');
        await api.patch('/auth/profile/', formData);
        await refreshUser();
        showFeedback('success', 'Succès', 'Photo de profil mise à jour ! 📸');
      } catch (e) {
        console.warn('Avatar upload error:', e?.response?.data || e);
        showFeedback('error', 'Erreur', 'Échec du changement de photo de profil.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleDeleteAccount = () => {
    Alert.prompt(
      'Supprimer mon compte',
      'Cette action est irréversible. Vos souvenirs et conversations seront supprimés. Entrez votre mot de passe pour confirmer :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async (pwd) => {
            if (!pwd) return;
            try {
              await api.post('/auth/delete-account/', { password: pwd });
              logout();
            } catch {
              Alert.alert('Erreur', 'Mot de passe incorrect.');
            }
          },
        },
      ],
      'secure-text'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          {user?.profile?.avatar ? (
            <Image source={{ uri: user.profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitials}>
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.cameraIconBtn}
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={COLORS.deepBlack} />
            ) : (
              <Ionicons name="camera" size={16} color={COLORS.deepBlack} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{user?.profile?.nickname || user?.username}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        {!!statusMsg.text && (
          <View
            style={{
              marginTop: 12,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor:
                statusMsg.type === 'error'
                  ? 'rgba(239,68,68,0.16)'
                  : 'rgba(74,222,128,0.16)',
            }}
          >
            <Text
              style={{
                color: statusMsg.type === 'error' ? '#fca5a5' : '#86efac',
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {statusMsg.text}
            </Text>
          </View>
        )}
      </View>

      {/* Profile Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Modifier mes informations</Text>

        <Text style={styles.inputLabel}>Mon surnom d'amour</Text>
        <TextInput
          style={styles.textInput}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Ex: Mon Cœur, Bae..."
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.inputLabel}>Bio secrète</Text>
        <TextInput
          style={[styles.textInput, { minHeight: 60 }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Une citation, une promesse..."
          placeholderTextColor={COLORS.textMuted}
          multiline
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleUpdateProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.deepBlack} />
          ) : (
            <Text style={styles.saveBtnText}>Sauvegarder</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Couple Space Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notre Espace de Couple</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom du couple :</Text>
          <Text style={styles.infoValue}>{couple?.name || 'Non défini'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ensemble depuis :</Text>
          <Text style={styles.infoValue}>
            {couple?.relationship_days !== null ? `${couple?.relationship_days} jours` : 'Non renseigné'}
          </Text>
        </View>
      </View>

      {/* Notifications Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Préférences de Notifications</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Nouveaux messages & vocaux</Text>
          <Switch
            value={msgNotifs}
            onValueChange={setMsgNotifs}
            trackColor={{ false: COLORS.surfaceBorder, true: COLORS.primaryRose }}
            thumbColor={COLORS.offWhite}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Alertes Flamme quotidienne 🔥</Text>
          <Switch
            value={flameNotifs}
            onValueChange={setFlameNotifs}
            trackColor={{ false: COLORS.surfaceBorder, true: COLORS.primaryRose }}
            thumbColor={COLORS.offWhite}
          />
        </View>
      </View>

      {/* Actions (Logout & Delete) */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.primaryRose} style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Supprimer mon compte définitivement</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: COLORS.primaryRose,
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primaryRose,
  },
  cameraIconBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primaryRose,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
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
  saveBtn: {
    backgroundColor: COLORS.primaryRose,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: COLORS.deepBlack,
    fontSize: 15,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: COLORS.primaryRose,
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  logoutButtonText: {
    color: COLORS.primaryRose,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
  },
});

