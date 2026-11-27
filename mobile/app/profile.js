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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api, { appendImageToFormData, resolveMediaUrl } from '../src/services/api';
import { requestNotificationPermission } from '../src/services/notifications';
import { useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/theme/colors';

export default function ProfileScreen() {
  const { user, couple, logout, refreshUser, refreshCouple } = useAuth();
  const [nickname, setNickname] = useState(user?.profile?.nickname || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [startDateInput, setStartDateInput] = useState(couple?.relationship_start_date || '');
  const [savingDate, setSavingDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Interactive Avatar Crop & Framing Modal state
  const [cropAsset, setCropAsset] = useState(null);
  const [cropZoom, setCropZoom] = useState(1.0);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);

  // Notifications toggles
  const [msgNotifs, setMsgNotifs] = useState(true);
  const [flameNotifs, setFlameNotifs] = useState(true);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
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
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS !== 'web',
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        if (Platform.OS === 'web') {
          // Open interactive circular crop & framing modal on Web
          setCropZoom(1.0);
          setCropOffsetX(0);
          setCropOffsetY(0);
          setCropAsset(asset);
        } else {
          await uploadAvatarAsset(asset);
        }
      }
    } catch (e) {
      console.warn('ImagePicker error:', e);
      showFeedback('error', 'Erreur', 'Impossible d’ouvrir la galerie photo.');
    }
  };

  const uploadAvatarAsset = async (asset, customBlob = null, previewUri = null) => {
    setLocalAvatarPreview(previewUri || asset.uri);
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      if (customBlob) {
        formData.append('avatar', customBlob, 'avatar.jpg');
      } else {
        await appendImageToFormData(formData, 'avatar', asset, 'avatar.jpg');
      }
      await api.patch('/auth/profile/', formData);
      await refreshUser();
      await refreshCouple();
      showFeedback('success', 'Succès', 'Photo de profil recadrée et mise à jour ! 📸');
    } catch (e) {
      console.warn('Avatar upload error:', e?.response?.data || e);
      showFeedback('error', 'Erreur', 'Échec du changement de photo de profil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleConfirmCropAvatar = async () => {
    if (!cropAsset) return;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const img = await new Promise((resolve, reject) => {
          const el = new window.Image();
          el.crossOrigin = 'anonymous';
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = cropAsset.uri;
        });

        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Cover-fit + apply user zoom & pan offset
        const baseScale = Math.max(size / img.width, size / img.height);
        const finalScale = baseScale * cropZoom;
        const drawW = img.width * finalScale;
        const drawH = img.height * finalScale;
        const scaleRatio = size / 220;
        const drawX = (size - drawW) / 2 + cropOffsetX * scaleRatio;
        const drawY = (size - drawH) / 2 + cropOffsetY * scaleRatio;

        ctx.fillStyle = '#17151C';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        const previewDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const chosen = cropAsset;
        setCropAsset(null);
        await uploadAvatarAsset(chosen, blob, previewDataUrl);
        return;
      } catch (e) {
        console.warn('Canvas crop failed, uploading raw image:', e);
      }
    }
    const chosen = cropAsset;
    setCropAsset(null);
    await uploadAvatarAsset(chosen);
  };

  const handleSaveStartDate = async () => {
    if (!startDateInput.trim()) return;
    setSavingDate(true);
    try {
      await api.patch('/couples/me/', { relationship_start_date: startDateInput.trim() });
      await refreshCouple();
      showFeedback('success', 'Succès', 'Date de début de relation mise à jour ! ❤️');
    } catch {
      showFeedback('error', 'Erreur', 'Format attendu : AAAA-MM-JJ (ex: 2025-02-14).');
    } finally {
      setSavingDate(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Veuillez entrer votre mot de passe pour confirmer.');
      return;
    }
    setDeleting(true);
    try {
      await api.post('/auth/delete-account/', { password: deletePassword });
      setShowDeleteModal(false);
      await logout();
    } catch (e) {
      setDeleteError(e.response?.data?.detail || 'Mot de passe incorrect.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          {localAvatarPreview || user?.profile?.avatar ? (
            <Image
              source={{ uri: localAvatarPreview || resolveMediaUrl(user.profile.avatar) }}
              style={styles.avatar}
            />
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
            {couple?.relationship_days ? `${couple.relationship_days} jours` : '1 jour'}
          </Text>
        </View>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Date officielle de début (AAAA-MM-JJ)</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
            value={startDateInput}
            onChangeText={setStartDateInput}
            placeholder="Ex: 2025-02-14"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primaryRose, borderRadius: 12, paddingHorizontal: 14, height: 46, justifyContent: 'center' }}
            onPress={handleSaveStartDate}
            disabled={savingDate}
          >
            {savingDate ? (
              <ActivityIndicator size="small" color={COLORS.deepBlack} />
            ) : (
              <Text style={{ color: COLORS.deepBlack, fontWeight: '700', fontSize: 13 }}>OK</Text>
            )}
          </TouchableOpacity>
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

        <TouchableOpacity
          style={[styles.saveBtn, { marginTop: 12 }]}
          onPress={async () => {
            const res = await requestNotificationPermission();
            if (res.granted) {
              showFeedback('success', 'Notifications activées', 'Notifications activées sur ce téléphone ! 🔔');
            } else {
              showFeedback('error', 'Notifications', res.reason || 'Impossible d’activer les notifications.');
            }
          }}
        >
          <Text style={styles.saveBtnText}>🔔 Activer les notifications sur ce téléphone</Text>
        </TouchableOpacity>
      </View>

      {/* Actions (Logout & Delete) */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.primaryRose} style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Supprimer mon compte définitivement</Text>
      </TouchableOpacity>

      {showDeleteModal && (
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 20,
            marginTop: 12,
            borderWidth: 1,
            borderColor: COLORS.error,
          }}
        >
          <Text style={{ color: COLORS.error, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>
            ⚠️ Confirmer la suppression
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 14 }}>
            Cette action est irréversible. Vos souvenirs, messages et espace couple seront supprimés. Entrez votre mot de passe pour confirmer :
          </Text>
          <TextInput
            style={styles.textInput}
            value={deletePassword}
            onChangeText={setDeletePassword}
            placeholder="Votre mot de passe actuel"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
          />
          {!!deleteError && (
            <Text style={{ color: '#fca5a5', fontSize: 13, marginBottom: 10 }}>{deleteError}</Text>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: COLORS.surfaceElevated,
                borderRadius: 12,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              <Text style={{ color: COLORS.textPrimary, fontWeight: '600' }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: COLORS.error,
                borderRadius: 12,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={confirmDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700' }}>Supprimer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Interactive Avatar Crop & Framing Modal */}
      <Modal visible={!!cropAsset} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: COLORS.surface, borderRadius: 26, padding: 22, borderWidth: 1, borderColor: COLORS.surfaceBorder, alignItems: 'center' }}>
            <Text style={{ color: COLORS.primaryRose, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>
              ✂️ Recadrer ma photo de profil
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12.5, textAlign: 'center', marginBottom: 16 }}>
              Zoome et déplace l’image pour bien centrer ton visage dans le cercle
            </Text>

            {/* Circular 220x220 Live Crop Frame */}
            <View
              style={{
                width: 220,
                height: 220,
                borderRadius: 110,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: COLORS.primaryRose,
                backgroundColor: COLORS.deepBlack,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              {cropAsset && (
                <Image
                  source={{ uri: cropAsset.uri }}
                  style={{
                    width: 220,
                    height: 220,
                    transform: [
                      { translateX: cropOffsetX },
                      { translateY: cropOffsetY },
                      { scale: cropZoom },
                    ],
                  }}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Zoom Controls */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.surfaceElevated, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setCropZoom((z) => Math.max(1.0, Number((z - 0.15).toFixed(2))))}
              >
                <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 14, minWidth: 80, textAlign: 'center' }}>
                Zoom {Math.round(cropZoom * 100)}%
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.surfaceElevated, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setCropZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
              >
                <Ionicons name="add" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Pan / Framing Controls */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.surfaceElevated, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setCropOffsetX((x) => Math.max(-90, x - 14))}
              >
                <Ionicons name="arrow-back" size={18} color={COLORS.primaryRose} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.surfaceElevated, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setCropOffsetY((y) => Math.max(-90, y - 14))}
              >
                <Ionicons name="arrow-up" size={18} color={COLORS.primaryRose} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.surfaceElevated, paddingHorizontal: 12, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => {
                  setCropZoom(1.0);
                  setCropOffsetX(0);
                  setCropOffsetY(0);
                }}
              >
                <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' }}>Centrer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.surfaceElevated, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setCropOffsetY((y) => Math.min(90, y + 14))}
              >
                <Ionicons name="arrow-down" size={18} color={COLORS.primaryRose} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.surfaceElevated, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setCropOffsetX((x) => Math.min(90, x + 14))}
              >
                <Ionicons name="arrow-forward" size={18} color={COLORS.primaryRose} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: 14, height: 46, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setCropAsset(null)}
              >
                <Text style={{ color: COLORS.textPrimary, fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: COLORS.primaryRose, borderRadius: 14, height: 46, justifyContent: 'center', alignItems: 'center' }}
                onPress={handleConfirmCropAvatar}
              >
                <Text style={{ color: COLORS.deepBlack, fontWeight: '800' }}>✅ Valider</Text>
              </TouchableOpacity>
            </View>
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

