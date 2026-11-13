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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { COLORS } from '../../src/theme/colors';

const CATEGORIES = [
  { id: 'date_night', label: 'Rendez-vous amoureux', icon: 'heart' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { id: 'cinema', label: 'Cinéma / Film', icon: 'film' },
  { id: 'anniversary', label: 'Anniversaire', icon: 'gift' },
  { id: 'trip', label: 'Voyage / Sortie', icon: 'airplane' },
  { id: 'activity', label: 'Activité spéciale', icon: 'sparkles' },
];

export default function CalendarScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'past'

  // Modal create
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('date_night');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('20:00');
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get(`/calendar/events/?filter=${filter}`);
      setEvents(res.data.results || res.data);
    } catch (e) {
      console.warn('Failed to fetch events:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async () => {
    if (!title.trim() || !eventDate.trim() || !eventTime.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir au moins le titre, la date et l’heure.');
      return;
    }

    setSubmitting(true);
    const start_time = `${eventDate}T${eventTime}:00Z`;

    try {
      await api.post('/calendar/events/', {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category,
        start_time,
      });
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setLocation('');
      fetchEvents();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d’enregistrer le rendez-vous.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    Alert.alert('Supprimer', 'Voulez-vous vraiment annuler ce rendez-vous ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/calendar/events/${id}/`);
            fetchEvents();
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notre Agenda 📅</Text>
          <Text style={styles.subtitle}>Planifiez vos rendez-vous et célébrations</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={COLORS.deepBlack} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, filter === 'upcoming' && styles.activeTab]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.tabText, filter === 'upcoming' && styles.activeTabText]}>
            À venir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, filter === 'past' && styles.activeTab]}
          onPress={() => setFilter('past')}
        >
          <Text style={[styles.tabText, filter === 'past' && styles.activeTabText]}>
            Moments passés
          </Text>
        </TouchableOpacity>
      </View>

      {/* Event List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={COLORS.primaryRose} size="large" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const catObj = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
            return (
              <View style={styles.eventCard}>
                <View style={styles.eventIconBox}>
                  <Ionicons name={catObj.icon} size={22} color={COLORS.primaryRose} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventDate}>
                    {new Date(item.start_time).toLocaleString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {item.location ? (
                    <Text style={styles.eventLocation}>📍 {item.location}</Text>
                  ) : null}
                  {item.description ? (
                    <Text style={styles.eventDesc}>{item.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
              <Text style={styles.emptySubtitle}>Ajoutez une sortie ou soirée romantique !</Text>
            </View>
          }
        />
      )}

      {/* Add Event Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Rendez-vous 💕</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Titre de l'événement</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Dîner aux chandelles au bord de l'eau"
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catChip, category === c.id && styles.activeCatChip]}
                    onPress={() => setCategory(c.id)}
                  >
                    <Ionicons
                      name={c.icon}
                      size={16}
                      color={category === c.id ? COLORS.deepBlack : COLORS.textPrimary}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        category === c.id && styles.activeCatChipText,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={eventDate}
                    onChangeText={setEventDate}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Heure (HH:MM)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={eventTime}
                    onChangeText={setEventTime}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Lieu (optionnel)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Le Lagon 1, Dakar"
                placeholderTextColor={COLORS.textMuted}
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.inputLabel}>Notes / Détails</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 60 }]}
                placeholder="Une tenue chic, réservé à mon nom..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateEvent}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.deepBlack} />
                ) : (
                  <Text style={styles.saveBtnText}>Bloquer cette date pour nous deux</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepBlack,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.deepBlack,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primaryRose,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryRose,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.primaryRose,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.deepBlack,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  eventIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(242, 167, 198, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  eventDate: {
    fontSize: 12,
    color: COLORS.primaryRose,
    marginTop: 4,
    fontWeight: '600',
  },
  eventLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  eventDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryRose,
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
  catScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    gap: 6,
  },
  activeCatChip: {
    backgroundColor: COLORS.primaryRose,
  },
  catChipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  activeCatChipText: {
    color: COLORS.deepBlack,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: COLORS.primaryRose,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveBtnText: {
    color: COLORS.deepBlack,
    fontSize: 15,
    fontWeight: '700',
  },
});

