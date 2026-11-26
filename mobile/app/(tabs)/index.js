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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { resolveMediaUrl } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

export default function HomeScreen() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const router = useRouter();

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
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
  const relationshipDays = dashboard?.couple?.relationship_days ?? 0;

  return (
    <ScrollView
      style={styles.container}
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

      {/* Love Match Header (Les deux amoureux) */}
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
        <View style={styles.lovePulse}>
          <Text style={styles.heartPulse}>❤️</Text>
          <Text style={styles.relationshipDaysText}>{relationshipDays} jours</Text>
          <Text style={styles.togetherLabel}>ensemble</Text>
        </View>

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

      {/* Flammes Streaks Section */}
      <View style={styles.flameCard}>
        <View style={styles.flameRow}>
          <View style={styles.flameIconBox}>
            <Text style={styles.flameEmoji}>🔥</Text>
          </View>
          <View style={styles.flameInfo}>
            <View style={styles.streakNumbers}>
              <Text style={styles.streakCount}>{flame?.current_streak || 0}</Text>
              <Text style={styles.streakLabel}>jours de flammes consécutifs</Text>
            </View>
            <Text style={styles.flameStatusText}>
              {flame?.is_lit_today
                ? '✨ Flamme du jour validée par les deux amoureux !'
                : 'Envoyez un message aujourd’hui pour entretenir votre flamme !'}
            </Text>
          </View>
        </View>
      </View>

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

