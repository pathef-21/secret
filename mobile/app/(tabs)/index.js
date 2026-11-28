import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import api, { appendImageToFormData, resolveMediaUrl } from '../../src/services/api';
import { downloadMediaFile } from '../../src/services/downloadMedia';
import {
  AmbientFloatingParticles,
  FadeSlideIn,
  FloatingHeartsBurst,
  PulseView,
} from '../../src/components/RomanticAnimations';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

export default function HomeScreen() {
  const { user, couple } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [instants, setInstants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Instant creation modal
  const [createInstantVisible, setCreateInstantVisible] = useState(false);
  const [instantAsset, setInstantAsset] = useState(null);
  const [instantCaption, setInstantCaption] = useState('');
  const [sendingInstant, setSendingInstant] = useState(false);
  const [instantError, setInstantError] = useState('');

  // One-time Instant viewer modal
  const [viewingInstant, setViewingInstant] = useState(null);
  const [openingInstant, setOpeningInstant] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  // Live Home Gallery (Notre Galerie)
  const [galleryItems, setGalleryItems] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryMsg, setGalleryMsg] = useState('');
  const [viewingGalleryItem, setViewingGalleryItem] = useState(null);
  const [downloadingGallery, setDownloadingGallery] = useState(false);

  const router = useRouter();

  const fetchGallery = useCallback(async () => {
    try {
      const res = await api.get('/memories/items/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setGalleryItems(list.slice(0, 12));
    } catch {
      // Ignore silent errors
    }
  }, []);

  const handleQuickAddGalleryPhoto = async () => {
    setGalleryMsg('');
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setGalleryMsg('Autorisez l’accès à la galerie.');
          return;
        }
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.[0]) return;

      const asset = res.assets[0];
      setUploadingGallery(true);
      const today = new Date().toISOString().split('T')[0];
      const formData = new FormData();
      formData.append('title', `Photo du ${new Date().toLocaleDateString('fr-FR')}`);
      formData.append('description', '');
      formData.append('location', '');
      formData.append('memory_date', today);
      formData.append('media_type', 'image');
      await appendImageToFormData(formData, 'media_file', asset, 'galerie.jpg');
      await api.post('/memories/items/', formData);
      await fetchGallery();
      setBurstKey((k) => k + 1);
      setGalleryMsg('Photo ajoutée à la galerie ❤️');
      setTimeout(() => setGalleryMsg(''), 3000);
    } catch {
      setGalleryMsg('Impossible d’ajouter la photo.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDownloadGalleryItem = async (item) => {
    if (!item?.media_file) return;
    setDownloadingGallery(true);
    try {
      const url = resolveMediaUrl(item.media_file);
      const ext = item.media_type === 'video' ? 'mp4' : 'jpg';
      await downloadMediaFile(url, `manakbae-galerie-${item.id || 'photo'}.${ext}`);
      setGalleryMsg('Téléchargement lancé ✅');
      setTimeout(() => setGalleryMsg(''), 3000);
    } finally {
      setDownloadingGallery(false);
    }
  };

  const fetchInstants = useCallback(async () => {
    try {
      const res = await api.get('/flames/instants/');
      setInstants(res.data);
    } catch {
      // Ignore if backend hasn't deployed /flames/instants/ yet
    }
  }, []);

  const handleCaptureInstantMedia = async (mode = 'image') => {
    setInstantError('');
    const isVideo = mode === 'video';

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Force live camera capture on mobile browsers (no gallery import)
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = isVideo ? 'video/*' : 'image/*';
      input.setAttribute('capture', 'user');
      input.onchange = (e) => {
        const file = e.target?.files?.[0];
        if (file) {
          const previewUri = URL.createObjectURL(file);
          setInstantAsset({
            uri: previewUri,
            file,
            fileName: file.name || (isVideo ? 'instant.mp4' : 'instant.jpg'),
            mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
            type: isVideo ? 'video' : 'image',
          });
        }
      };
      input.click();
      return;
    }

    // Native iOS / Android: camera only (never gallery)
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setInstantError('Autorisez la caméra pour prendre un Instant en direct.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: isVideo ? ['videos'] : ['images'],
        allowsEditing: !isVideo,
        videoMaxDuration: 30,
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setInstantAsset(res.assets[0]);
      }
    } catch {
      setInstantError('Impossible d’ouvrir la caméra.');
    }
  };

  const handleSendInstant = async () => {
    setInstantError('');
    if (!instantAsset) {
      setInstantError('Choisis d’abord une photo ou une vidéo.');
      return;
    }
    setSendingInstant(true);
    try {
      const formData = new FormData();
      const isVideo =
        instantAsset.type === 'video' || (instantAsset.mimeType || '').startsWith('video/');
      formData.append('media_type', isVideo ? 'video' : 'image');
      formData.append('caption', instantCaption.trim());
      await appendImageToFormData(
        formData,
        'media_file',
        instantAsset,
        isVideo ? 'instant.mp4' : 'instant.jpg'
      );

      await api.post('/flames/instants/', formData);
      setCreateInstantVisible(false);
      setInstantAsset(null);
      setInstantCaption('');
      setBurstKey((k) => k + 1);
      await Promise.all([fetchInstants(), fetchDashboardData()]);
    } catch (e) {
      setInstantError(e?.response?.data?.detail || 'Impossible d’envoyer cet Instant.');
    } finally {
      setSendingInstant(false);
    }
  };

  const handleOpenPartnerInstant = async () => {
    const pInst = instants?.partner_instant;
    if (!pInst || !pInst.can_view || openingInstant) return;
    setOpeningInstant(true);
    try {
      const res = await api.post(`/flames/instants/${pInst.id}/view/`);
      setViewingInstant({
        ...res.data,
        media_url: resolveMediaUrl(res.data.media_url),
      });
      fetchInstants();
    } catch {
      fetchInstants();
    } finally {
      setOpeningInstant(false);
    }
  };

  const handleGetInviteCode = async () => {
    setLoadingInvite(true);
    try {
      const res = await api.post('/couples/invite/');
      setInviteCode(res.data.code || '');
    } catch (e) {
      console.warn('Invite generation error:', e);
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(inviteCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
      } catch {}
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.get('/couples/dashboard/');
      setDashboard(res.data);
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchInstants();
    fetchGallery();
    const timer = setInterval(fetchInstants, 8000);
    return () => clearInterval(timer);
  }, [fetchDashboardData, fetchInstants, fetchGallery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    fetchInstants();
    fetchGallery();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryRose} />
      </View>
    );
  }

  const partner = dashboard?.partner;
  const flame = dashboard?.flame;
  const nextEvent = dashboard?.next_event;
  const computedFallbackDays = (() => {
    const startStr = dashboard?.couple?.relationship_start_date || couple?.relationship_start_date || couple?.created_at;
    if (!startStr) return 1;
    const startMs = new Date(startStr).getTime();
    if (Number.isNaN(startMs)) return 1;
    const diff = Math.floor((Date.now() - startMs) / 86400000);
    return Math.max(1, diff + 1);
  })();
  const relationshipDays =
    dashboard?.couple?.relationship_days && dashboard.couple.relationship_days > 0
      ? dashboard.couple.relationship_days
      : computedFallbackDays;
  const unreadMessagesCount = dashboard?.unread_messages_count ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.deepBlack }}>
      <AmbientFloatingParticles />
      <ScrollView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryRose} />}
      >
      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingText}>Man Ak Bae ❤️</Text>
          <Text style={styles.coupleTitle}>{dashboard?.couple?.name || 'Notre bulle d’amour'}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
          <Ionicons name="settings-outline" size={22} color={COLORS.primaryRose} />
        </TouchableOpacity>
      </View>

      {/* Unread Messages Alert Banner */}
      {unreadMessagesCount > 0 && (
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/chat')}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 59, 107, 0.16)',
            borderColor: '#FF3B6B',
            borderWidth: 1,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Text style={{ fontSize: 20 }}>💌</Text>
            <Text style={{ color: '#FFF9F7', fontSize: 13.5, fontWeight: '700' }}>
              {unreadMessagesCount === 1
                ? 'Tu as 1 nouveau message non lu !'
                : `Tu as ${unreadMessagesCount} nouveaux messages non lus !`}
            </Text>
          </View>
          <Text style={{ color: '#FF3B6B', fontWeight: '800', fontSize: 13 }}>Lire →</Text>
        </TouchableOpacity>
      )}

      {/* Invite Partner Card when partner hasn't joined yet */}
      {!partner && (
        <View style={{ backgroundColor: 'rgba(242,167,198,0.12)', borderColor: COLORS.primaryRose, borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 18, alignItems: 'center' }}>
          <Text style={{ color: COLORS.primaryRose, fontSize: 15, fontWeight: '800', marginBottom: 6 }}>
            💑 Inviter ton/ta partenaire
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12.5, textAlign: 'center', marginBottom: 12 }}>
            Partage ce code à ton Bae pour qu’il/elle rejoigne votre espace (« Rejoindre mon Bae »).
          </Text>
          {inviteCode ? (
            <>
              <View style={{ backgroundColor: COLORS.surfaceElevated, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1.5, borderColor: COLORS.primaryRose, borderStyle: 'dashed', marginBottom: 10 }}>
                <Text style={{ color: COLORS.primaryRose, fontSize: 24, fontWeight: '800', letterSpacing: 4 }} selectable>
                  {inviteCode}
                </Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.primaryRose, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 }}
                onPress={handleCopyInviteCode}
              >
                <Text style={{ color: COLORS.deepBlack, fontWeight: '700', fontSize: 13 }}>
                  {copiedCode ? 'Code copié ! ✅' : '📋 Copier le code'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={{ backgroundColor: COLORS.primaryRose, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 }}
              onPress={handleGetInviteCode}
              disabled={loadingInvite}
            >
              {loadingInvite ? (
                <ActivityIndicator color={COLORS.deepBlack} />
              ) : (
                <Text style={{ color: COLORS.deepBlack, fontWeight: '700', fontSize: 13 }}>
                  Afficher mon code d’invitation
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Love Match Header (Les deux amoureux & Jours ensemble — en haut) */}
      <FadeSlideIn delay={60}>
      <View style={styles.loveMatchCard}>
        <View style={styles.partnerColumn}>
          <View style={styles.avatarWrapper}>
            {user?.profile?.avatar ? (
              <Image source={{ uri: resolveMediaUrl(user.profile.avatar) }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{user?.first_name?.[0] || user?.username?.[0] || 'M'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.partnerName} numberOfLines={1}>
            {user?.profile?.nickname || user?.first_name || 'Moi'}
          </Text>
        </View>

        {/* Central Love Pulse */}
        <TouchableOpacity style={styles.lovePulse} activeOpacity={0.8} onPress={() => setBurstKey((k) => k + 1)}>
          <PulseView active mode="heartbeat">
            <Text style={styles.heartPulse}>❤️</Text>
          </PulseView>
          <Text style={styles.relationshipDaysText}>
            {relationshipDays} {relationshipDays > 1 ? 'jours' : 'jour'}
          </Text>
          <Text style={styles.togetherLabel}>ensemble</Text>
        </TouchableOpacity>

        <View style={styles.partnerColumn}>
          <View style={styles.avatarWrapper}>
            {partner?.profile?.avatar ? (
              <Image source={{ uri: resolveMediaUrl(partner.profile.avatar) }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{partner?.first_name?.[0] || partner?.username?.[0] || 'B'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.partnerName} numberOfLines={1}>
            {partner?.profile?.nickname || partner?.first_name || 'Bae'}
          </Text>
        </View>
      </View>
      </FadeSlideIn>

      {/* Instagram-style Daily Instants (Vue unique 1x — critère Flamme) */}
      <FadeSlideIn delay={150}>
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 22,
          padding: 16,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: COLORS.surfaceBorder,
          overflow: 'hidden',
        }}
      >
        <View style={{ marginBottom: 14 }}>
          <Text style={{ color: COLORS.textPrimary, fontSize: 15.5, fontWeight: '800' }}>
            🔥 Instants du Jour
          </Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 11.5, marginTop: 3, lineHeight: 16 }}>
            1 photo ou vidéo / jour chacun • Vue unique (1×) pour garder la flamme
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          {/* Mon Instant */}
          <TouchableOpacity
            style={{ alignItems: 'center', width: 120 }}
            onPress={() => {
              setInstantError('');
              setCreateInstantVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                padding: 3,
                borderWidth: 2.5,
                borderColor: instants?.my_sent_today ? '#4ADE80' : COLORS.primaryRose,
                borderStyle: instants?.my_sent_today ? 'solid' : 'dashed',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {user?.profile?.avatar ? (
                <Image
                  source={{ uri: resolveMediaUrl(user.profile.avatar) }}
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surfaceElevated, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.primaryRose, fontSize: 24, fontWeight: '800' }}>
                    {user?.first_name?.[0] || user?.username?.[0] || 'M'}
                  </Text>
                </View>
              )}
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: instants?.my_sent_today ? '#4ADE80' : COLORS.primaryRose,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: COLORS.surface,
                }}
              >
                <Ionicons
                  name={instants?.my_sent_today ? 'checkmark' : 'add'}
                  size={14}
                  color={COLORS.deepBlack}
                />
              </View>
            </View>
            <Text style={{ color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700', marginTop: 8 }}>
              Mon Instant
            </Text>
            <Text style={{ color: instants?.my_sent_today ? '#4ADE80' : COLORS.primaryRose, fontSize: 11, marginTop: 2 }}>
              {instants?.my_sent_today
                ? instants?.my_instant?.viewed_by_partner
                  ? 'Vu par Bae 👁️'
                  : 'Envoyé 🔥'
                : 'Ajouter 📸'}
            </Text>
          </TouchableOpacity>

          {/* Instant du partenaire */}
          <TouchableOpacity
            style={{ alignItems: 'center', width: 120 }}
            onPress={handleOpenPartnerInstant}
            disabled={!instants?.partner_instant?.can_view || openingInstant}
            activeOpacity={0.8}
          >
            <PulseView active={!!instants?.partner_instant?.can_view} mode="breath">
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                padding: 3,
                borderWidth: 3,
                borderColor: instants?.partner_instant?.can_view
                  ? '#FF3B6B'
                  : instants?.partner_sent_today
                  ? COLORS.textMuted
                  : COLORS.surfaceBorder,
                borderStyle: instants?.partner_sent_today ? 'solid' : 'dashed',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {partner?.profile?.avatar ? (
                <Image
                  source={{ uri: resolveMediaUrl(partner.profile.avatar) }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    opacity: instants?.partner_instant?.can_view ? 1 : 0.55,
                  }}
                />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surfaceElevated, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.primaryRose, fontSize: 24, fontWeight: '800' }}>
                    {partner?.first_name?.[0] || 'B'}
                  </Text>
                </View>
              )}

              {instants?.partner_instant?.can_view && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    backgroundColor: '#FF3B6B',
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderWidth: 2,
                    borderColor: COLORS.surface,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>1× 🔥</Text>
                </View>
              )}
            </View>
            </PulseView>
            <Text style={{ color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700', marginTop: 8 }} numberOfLines={1}>
              {partner?.profile?.nickname || partner?.first_name || 'Mon Bae'}
            </Text>
            <Text
              style={{
                color: instants?.partner_instant?.can_view ? '#FF3B6B' : COLORS.textMuted,
                fontSize: 11,
                fontWeight: instants?.partner_instant?.can_view ? '700' : '400',
                marginTop: 2,
              }}
            >
              {openingInstant
                ? 'Ouverture...'
                : instants?.partner_instant?.can_view
                ? 'Appuyer pour voir !'
                : instants?.partner_sent_today
                ? 'Déjà vu 👁️'
                : 'En attente...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </FadeSlideIn>

      {/* Flammes Streaks Section */}
      <FadeSlideIn delay={240}>
      <View style={styles.flameCard}>
        <View style={styles.flameRow}>
          <PulseView active mode="breath">
            <View style={styles.flameIconBox}>
              <Text style={styles.flameEmoji}>🔥</Text>
            </View>
          </PulseView>
          <View style={styles.flameInfo}>
            <View style={styles.streakNumbers}>
              <Text style={styles.streakCount}>{flame?.current_streak || 0}</Text>
              <Text style={styles.streakLabel}>jours de flammes consécutifs</Text>
            </View>
            <Text style={styles.flameStatusText}>
              {flame?.is_lit_today
                ? '✨ Flamme du jour validée par vos deux Instants !'
                : `Critère du jour : ${instants?.my_sent_today ? '✅ Ton Instant' : '⏳ Ton Instant'} • ${instants?.partner_sent_today ? '✅ Instant de Bae' : '⏳ Instant de Bae'}`}
            </Text>
          </View>
        </View>
      </View>
      </FadeSlideIn>

      {/* Notre Galerie (photos à jour sur l'accueil) */}
      <FadeSlideIn delay={280}>
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 24,
          padding: 18,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: COLORS.surfaceBorder,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <Text style={{ color: COLORS.primaryRose, fontSize: 16, fontWeight: '800' }}>
              📸 Notre Galerie
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>
              Vos photos récentes toujours à jour
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/memories')}>
            <Text style={{ color: COLORS.primaryRose, fontSize: 12, fontWeight: '700' }}>Voir tout →</Text>
          </TouchableOpacity>
        </View>

        {!!galleryMsg && (
          <Text style={{ color: '#86efac', fontSize: 12, fontWeight: '600', marginBottom: 10 }}>
            {galleryMsg}
          </Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {/* Quick add photo tile */}
          <TouchableOpacity
            style={{
              width: 96,
              height: 118,
              borderRadius: 16,
              backgroundColor: 'rgba(242, 167, 198, 0.12)',
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: COLORS.primaryRose,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 8,
            }}
            onPress={handleQuickAddGalleryPhoto}
            disabled={uploadingGallery}
            activeOpacity={0.85}
          >
            {uploadingGallery ? (
              <ActivityIndicator color={COLORS.primaryRose} />
            ) : (
              <>
                <Ionicons name="add-circle" size={28} color={COLORS.primaryRose} />
                <Text style={{ color: COLORS.primaryRose, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 6 }}>
                  Ajouter une photo
                </Text>
              </>
            )}
          </TouchableOpacity>

          {galleryItems.map((item) => (
            <TouchableOpacity
              key={String(item.id)}
              style={{
                width: 96,
                height: 118,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: COLORS.surfaceElevated,
                borderWidth: 1,
                borderColor: COLORS.surfaceBorder,
              }}
              onPress={() => setViewingGalleryItem(item)}
              activeOpacity={0.88}
            >
              {item.media_type === 'video' ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1420' }}>
                  <Ionicons name="play-circle" size={32} color={COLORS.primaryRose} />
                  <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 4 }}>Vidéo</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: resolveMediaUrl(item.media_file) }}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </TouchableOpacity>
          ))}

          {galleryItems.length === 0 && (
            <View
              style={{
                width: 190,
                height: 118,
                borderRadius: 16,
                backgroundColor: COLORS.surfaceElevated,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 14,
              }}
            >
              <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center' }}>
                Ajoutez votre première photo de couple ici 💕
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      </FadeSlideIn>

      {/* Citation Romantique Inspirante */}
      {dashboard?.quote_of_the_day && (
        <View style={styles.quoteCard}>
          <Ionicons name="heart-dislike-outline" size={18} color={COLORS.primaryRose} style={styles.quoteIcon} />
          <Text style={styles.quoteText}>{dashboard.quote_of_the_day}</Text>
        </View>
      )}

      {/* Raccourcis Romantiques Spéciaux */}
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/letters')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(242, 167, 198, 0.15)' }]}>
            <Ionicons name="mail-unread-outline" size={24} color={COLORS.primaryRose} />
          </View>
          <Text style={styles.actionTitle}>Lettres d’Amour</Text>
          <Text style={styles.actionBadge}>
            {dashboard?.unread_letters_count > 0 ? `${dashboard.unread_letters_count} à lire` : 'Écrire'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/games')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
            <Ionicons name="dice-outline" size={24} color={COLORS.violet} />
          </View>
          <Text style={styles.actionTitle}>Jeux de Couple</Text>
          <Text style={styles.actionBadge}>7 jeux intimes</Text>
        </TouchableOpacity>
      </View>

      {/* Prochain Rendez-vous */}
      {nextEvent ? (
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primaryRose} />
            <Text style={styles.eventHeaderTitle}>Prochain rendez-vous</Text>
          </View>
          <Text style={styles.eventTitle}>{nextEvent.title}</Text>
          <Text style={styles.eventDetails}>
            {new Date(nextEvent.start_time).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {nextEvent.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.locationText}>{nextEvent.location}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Raccourci vers Chat */}
      <TouchableOpacity
        style={styles.openChatButton}
        onPress={() => router.push('/(tabs)/chat')}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.deepBlack} style={{ marginRight: 8 }} />
        <Text style={styles.openChatButtonText}>Parler à mon Bae ❤️</Text>
      </TouchableOpacity>
      {/* Modal 1: Send Daily Instant (Photo or Video) */}
      {/* Modal 0: Fullscreen Home Gallery Photo Viewer + Download */}
      <Modal visible={!!viewingGalleryItem} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: Platform.OS === 'ios' ? 54 : 24,
              paddingBottom: 14,
              backgroundColor: 'rgba(0,0,0,0.85)',
            }}
          >
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
                {viewingGalleryItem?.title || 'Notre Galerie'}
              </Text>
              {!!viewingGalleryItem?.memory_date && (
                <Text style={{ color: COLORS.primaryRose, fontSize: 11, marginTop: 2 }}>
                  {viewingGalleryItem.memory_date}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: COLORS.primaryRose,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                marginRight: 10,
              }}
              onPress={() => handleDownloadGalleryItem(viewingGalleryItem)}
              disabled={downloadingGallery}
            >
              {downloadingGallery ? (
                <ActivityIndicator size="small" color={COLORS.deepBlack} />
              ) : (
                <>
                  <Ionicons name="download-outline" size={16} color={COLORS.deepBlack} />
                  <Text style={{ color: COLORS.deepBlack, fontSize: 12, fontWeight: '800' }}>Télécharger</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.16)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setViewingGalleryItem(null)}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 8 }}>
            {viewingGalleryItem?.media_type === 'video' && Platform.OS === 'web' ? (
              <video
                src={resolveMediaUrl(viewingGalleryItem.media_file)}
                controls
                playsInline
                style={{ width: '100%', maxHeight: '85%', backgroundColor: '#000' }}
              />
            ) : viewingGalleryItem ? (
              <Image
                source={{ uri: resolveMediaUrl(viewingGalleryItem.media_file) }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
      <Modal visible={createInstantVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: COLORS.surfaceBorder }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: COLORS.primaryRose, fontSize: 19, fontWeight: '800' }}>
                🔥 Mon Instant du Jour
              </Text>
              <TouchableOpacity onPress={() => setCreateInstantVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 16 }}>
              Prends une photo ou filme une vidéo en direct (caméra uniquement, pas d’import) — vue unique (1×) pour garder votre flamme !
            </Text>

            {!!instantError && (
              <View style={{ backgroundColor: 'rgba(239,68,68,0.16)', borderRadius: 12, padding: 10, marginBottom: 12 }}>
                <Text style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>{instantError}</Text>
              </View>
            )}

            {instantAsset ? (
              <View
                style={{
                  height: 170,
                  borderRadius: 18,
                  backgroundColor: COLORS.surfaceElevated,
                  borderWidth: 1.5,
                  borderColor: COLORS.primaryRose,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {instantAsset.type === 'video' || (instantAsset.mimeType || '').startsWith('video/') ? (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="videocam" size={40} color={COLORS.primaryRose} />
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 8 }}>
                      Vidéo filmée en direct ✅
                    </Text>
                  </View>
                ) : (
                  <Image source={{ uri: instantAsset.uri }} style={{ width: '100%', height: '100%' }} />
                )}
                <TouchableOpacity
                  onPress={() => setInstantAsset(null)}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    borderRadius: 14,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Reprendre</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => handleCaptureInstantMedia('image')}
                  style={{
                    flex: 1,
                    height: 120,
                    borderRadius: 18,
                    backgroundColor: COLORS.surfaceElevated,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: COLORS.primaryRose,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="camera" size={34} color={COLORS.primaryRose} />
                  <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 8 }}>
                    Prendre une photo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleCaptureInstantMedia('video')}
                  style={{
                    flex: 1,
                    height: 120,
                    borderRadius: 18,
                    backgroundColor: COLORS.surfaceElevated,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: '#A78BFA',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="videocam" size={34} color="#A78BFA" />
                  <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 8 }}>
                    Filmer une vidéo
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={{
                backgroundColor: COLORS.surfaceElevated,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: COLORS.textPrimary,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.surfaceBorder,
              }}
              placeholder="Ajouter un petit mot (optionnel)..."
              placeholderTextColor={COLORS.textMuted}
              value={instantCaption}
              onChangeText={setInstantCaption}
              maxLength={160}
            />

            <TouchableOpacity
              style={{
                backgroundColor: COLORS.primaryRose,
                borderRadius: 14,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleSendInstant}
              disabled={sendingInstant}
            >
              {sendingInstant ? (
                <ActivityIndicator color={COLORS.deepBlack} />
              ) : (
                <Text style={{ color: COLORS.deepBlack, fontSize: 15, fontWeight: '800' }}>
                  🔥 Envoyer mon Instant (vue unique)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Full-Screen One-Time Instant Viewer */}
      <Modal visible={!!viewingInstant} animationType="fade" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'space-between', paddingTop: 48, paddingBottom: 34, paddingHorizontal: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                🔥 Instant de {viewingInstant?.sender_name}
              </Text>
              <Text style={{ color: '#FF3B6B', fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                Vue unique (1×) — disparaîtra à la fermeture
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setViewingInstant(null)}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 16 }}>
            {viewingInstant?.media_type === 'video' ? (
              Platform.OS === 'web' ? (
                <video
                  src={viewingInstant.media_url}
                  controls
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: '75vh', borderRadius: 16 }}
                />
              ) : (
                <Video
                  source={{ uri: viewingInstant.media_url }}
                  style={{ width: '100%', height: 420, borderRadius: 16 }}
                  useNativeControls
                  shouldPlay
                  resizeMode={ResizeMode.CONTAIN}
                />
              )
            ) : viewingInstant?.media_url ? (
              <Image
                source={{ uri: viewingInstant.media_url }}
                style={{ width: '100%', height: '100%', borderRadius: 16 }}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {!!viewingInstant?.caption && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontSize: 15, textAlign: 'center', fontWeight: '600' }}>
                {viewingInstant.caption}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={{ backgroundColor: COLORS.primaryRose, borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setViewingInstant(null)}
          >
            <Text style={{ color: COLORS.deepBlack, fontSize: 15, fontWeight: '800' }}>Fermer l’Instant</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      </ScrollView>
      <FloatingHeartsBurst triggerKey={burstKey} />
    </View>
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
    backgroundColor: COLORS.deepBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 14,
    color: COLORS.primaryRose,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  coupleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  loveMatchCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  partnerColumn: {
    alignItems: 'center',
    width: 90,
  },
  avatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.primaryRose,
    overflow: 'hidden',
    marginBottom: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primaryRose,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  lovePulse: {
    alignItems: 'center',
  },
  heartPulse: {
    fontSize: 28,
    marginBottom: 4,
  },
  relationshipDaysText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryRose,
  },
  togetherLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  flameCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  flameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 136, 51, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  flameEmoji: {
    fontSize: 26,
  },
  flameInfo: {
    flex: 1,
  },
  streakNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakCount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.flameOrange,
    marginRight: 8,
  },
  streakLabel: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  flameStatusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  quoteCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryRose,
  },
  quoteIcon: {
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  actionBadge: {
    fontSize: 12,
    color: COLORS.primaryRose,
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 18,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventHeaderTitle: {
    fontSize: 13,
    color: COLORS.primaryRose,
    fontWeight: '700',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  openChatButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryRose,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  openChatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.deepBlack,
  },
});

