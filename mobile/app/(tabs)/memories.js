import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/services/api';
import { COLORS } from '../../src/theme/colors';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 52) / 2;

export default function MemoriesScreen() {
  const [memories, setMemories] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'albums'

  // Add memory modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [commentText, setCommentText] = useState('');

  const fetchMemories = useCallback(async () => {
    try {
      const [memRes, albRes] = await Promise.all([
        api.get('/memories/items/'),
        api.get('/memories/albums/'),
      ]);
      setMemories(memRes.data.results || memRes.data);
      setAlbums(albRes.data.results || albRes.data);
    } catch (e) {
      console.warn('Failed to load memories:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission requise', 'Accès à la galerie nécessaire.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!res.canceled && res.assets[0]) {
      setSelectedAsset(res.assets[0]);
    }
  };

  const handleCreateMemory = async () => {
    if (!title.trim() || !selectedAsset) {
      Alert.alert('Champs requis', 'Veuillez sélectionner une photo ou vidéo et renseigner un titre.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('location', location.trim());
    formData.append('memory_date', memoryDate);
    formData.append('media_type', selectedAsset.type === 'video' ? 'video' : 'image');
    formData.append('media_file', {
      uri: selectedAsset.uri,
      name: selectedAsset.type === 'video' ? 'video.mp4' : 'image.jpg',
      type: selectedAsset.type === 'video' ? 'video/mp4' : 'image/jpeg',
    });

    try {
      await api.post('/memories/items/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAddModalVisible(false);
      setTitle('');
      setDescription('');
      setLocation('');
      setSelectedAsset(null);
      fetchMemories();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d’enregistrer ce souvenir.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedMemory) return;
    try {
      await api.post('/memories/comments/', {
        memory: selectedMemory.id,
        content: commentText.trim(),
      });
      setCommentText('');
      // Refresh memory detail
      const res = await api.get(`/memories/items/${selectedMemory.id}/`);
      setSelectedMemory(res.data);
      fetchMemories();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d’ajouter le commentaire.');
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nos Souvenirs 📸</Text>
          <Text style={styles.subtitle}>Les plus beaux moments de notre histoire</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={24} color={COLORS.deepBlack} />
        </TouchableOpacity>
      </View>

      {/* Grid of Memories */}
      <FlatList
        data={memories}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.memoryCard}
            onPress={() => setSelectedMemory(item)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.media_file }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardDate}>{item.memory_date}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aucun souvenir pour l’instant</Text>
            <Text style={styles.emptySubtitle}>Ajoutez vos premières photos ensemble !</Text>
          </View>
        }
      />

      {/* Add Memory Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Souvenir ❤️</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.pickerBox} onPress={pickMedia}>
                {selectedAsset ? (
                  <Image source={{ uri: selectedAsset.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.pickerPlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={36} color={COLORS.primaryRose} />
                    <Text style={styles.pickerText}>Choisir une photo ou vidéo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Titre du souvenir</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Notre première soirée à Gorée"
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2024-05-12"
                placeholderTextColor={COLORS.textMuted}
                value={memoryDate}
                onChangeText={setMemoryDate}
              />

              <Text style={styles.inputLabel}>Lieu (optionnel)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Dakar, Sénégal"
                placeholderTextColor={COLORS.textMuted}
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 70 }]}
                placeholder="Racontez ce moment inoubliable..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleCreateMemory}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.deepBlack} />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer dans notre album</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Memory Detail Modal with Comments */}
      <Modal visible={!!selectedMemory} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMemory?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedMemory(null)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedMemory && (
                <>
                  <Image source={{ uri: selectedMemory.media_file }} style={styles.detailImage} />
                  <Text style={styles.detailDate}>
                    🗓️ {selectedMemory.memory_date} {selectedMemory.location ? `• 📍 ${selectedMemory.location}` : ''}
                  </Text>
                  {selectedMemory.description ? (
                    <Text style={styles.detailDescription}>{selectedMemory.description}</Text>
                  ) : null}

                  {/* Comments section */}
                  <Text style={styles.commentsHeading}>Mots doux ({selectedMemory.comments?.length || 0})</Text>
                  {selectedMemory.comments?.map((c) => (
                    <View key={c.id} style={styles.commentItem}>
                      <Text style={styles.commentAuthor}>{c.user.username}</Text>
                      <Text style={styles.commentContent}>{c.content}</Text>
                    </View>
                  ))}

                  <View style={styles.commentInputRow}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Laisser un mot tendre..."
                      placeholderTextColor={COLORS.textMuted}
                      value={commentText}
                      onChangeText={setCommentText}
                    />
                    <TouchableOpacity style={styles.sendCommentBtn} onPress={handleAddComment}>
                      <Ionicons name="heart" size={18} color={COLORS.deepBlack} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  listContent: {
    padding: 18,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  memoryCard: {
    width: COLUMN_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.surfaceElevated,
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardDate: {
    fontSize: 11,
    color: COLORS.primaryRose,
    marginTop: 4,
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
  pickerBox: {
    height: 160,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  pickerPlaceholder: {
    alignItems: 'center',
  },
  pickerText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
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
  saveButton: {
    backgroundColor: COLORS.primaryRose,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    color: COLORS.deepBlack,
    fontSize: 15,
    fontWeight: '700',
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 14,
  },
  detailDate: {
    fontSize: 13,
    color: COLORS.primaryRose,
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 20,
  },
  commentsHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  commentItem: {
    backgroundColor: COLORS.surfaceElevated,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryRose,
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    color: COLORS.textPrimary,
  },
  sendCommentBtn: {
    backgroundColor: COLORS.primaryRose,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

