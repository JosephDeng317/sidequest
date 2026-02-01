import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { createPost } from '../services/posts';
import { updateStatsOnQuestComplete } from '../services/userStats';

const isWeb = Platform.OS === 'web';

// Web-friendly image picker options (allowsEditing can cause issues on some browsers)
const libraryOptions = {
  mediaTypes: ['images'],
  allowsEditing: !isWeb,
  aspect: isWeb ? undefined : [4, 3],
  quality: 0.8,
};

const cameraOptions = {
  mediaTypes: ['images'],
  allowsEditing: !isWeb,
  aspect: isWeb ? undefined : [4, 3],
  quality: 0.8,
};

export default function CreatePostScreen({ navigation }) {
  const route = useRoute();
  const questTitle = route.params?.questTitle ?? '';
  const questDescription = route.params?.questDescription ?? '';
  const questPhotos = route.params?.questPhotos ?? [];
  const questCategory = route.params?.questCategory ?? '';
  const questDifficulty = route.params?.questDifficulty ?? 2;

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUris, setImageUris] = useState([]);

  useEffect(() => {
    if (questTitle) setTitle(questTitle);
    if (questDescription) setCaption(questDescription);
    if (Array.isArray(questPhotos) && questPhotos.length > 0) {
      setImageUris([...questPhotos]);
    }
  }, [questTitle, questDescription, questPhotos]);
  const [loading, setLoading] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);

  const showError = (title, message) => {
    if (isWeb) {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // const takePhoto = async () => {
  //   setShowImageSourceModal(false);
  //   try {
  //     const { status } = await ImagePicker.requestCameraPermissionsAsync();
  //     if (status !== 'granted') {
  //       showError('Permission needed', 'Allow access to your camera to take a photo.');
  //       return;
  //     }
  //     const result = await ImagePicker.launchCameraAsync(cameraOptions);
  //     if (!result.canceled) {
  //       setImageUris((prev) => [...prev, result.assets[0].uri]);
  //     }
  //   } catch (err) {
  //     showError('Camera error', err.message || 'Could not open camera. Try choosing from library instead.');
  //   }
  // };

  // const pickFromLibrary = async () => {
  //   setShowImageSourceModal(false);
  //   try {
  //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //     if (status !== 'granted') {
  //       showError('Permission needed', 'Allow access to your photos to add an image.');
  //       return;
  //     }
  //     const result = await ImagePicker.launchImageLibraryAsync(libraryOptions);
  //     if (!result.canceled) {
  //       setImageUris((prev) => [...prev, result.assets[0].uri]);
  //     }
  //   } catch (err) {
  //     showError('Error', err.message || 'Could not open photo library.');
  //   }
  // };

  const removePhoto = (index) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    setShowImageSourceModal(true);
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showError('Missing title', 'Please enter a title for your post.');
      return;
    }
    setLoading(true);
    try {
      await createPost({
        title: trimmedTitle,
        caption: caption.trim(),
        imageUris: imageUris.length > 0 ? imageUris : null,
        questCategory: questCategory || null,
        questDifficulty: questDifficulty,
      });
      if (questCategory) {
        try {
          await updateStatsOnQuestComplete({ category: questCategory, difficulty: questDifficulty });
        } catch (statsErr) {
          // Don't block navigation if stats update fails
        }
      }
      navigation.goBack();
    } catch (err) {
      showError('Error', err.message || 'Could not create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />
      <TextInput
        style={[styles.input, styles.caption]}
        placeholder="Caption (optional)"
        placeholderTextColor="#888"
        value={caption}
        onChangeText={setCaption}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.photosLabel}>Photos</Text>
      {/* <TouchableOpacity style={styles.imageButton} onPress={showImageOptions}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {imageUris.length > 0 ? 'Add another photo' : 'Tap to add a photo'}
          </Text>
        </View>
      </TouchableOpacity> */}
      {imageUris.length > 0 ? (
        <View style={styles.photoList}>
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.photoRow}>
              <Image source={{ uri }} style={styles.previewThumb} resizeMode="cover" />
              <TouchableOpacity onPress={() => removePhoto(index)} style={styles.removePhotoBtn}>
                <Text style={styles.removePhoto}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      <Modal
        visible={showImageSourceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageSourceModal(false)}
      >
        <Pressable
          style={styles.imageSourceOverlay}
          onPress={() => setShowImageSourceModal(false)}
        >
          <Pressable style={styles.imageSourceModal} onPress={(e) => e.stopPropagation()}>
            {/* <Text style={styles.imageSourceTitle}>Add photo</Text>
            <Text style={styles.imageSourceSubtitle}>Choose how to add a photo</Text>
            <TouchableOpacity style={styles.imageSourceBtn} onPress={takePhoto}>
              <Text style={styles.imageSourceBtnText}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageSourceBtn} onPress={pickFromLibrary}>
              <Text style={styles.imageSourceBtnText}>Choose from library</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={[styles.imageSourceBtn, styles.imageSourceBtnCancel]}
              onPress={() => setShowImageSourceModal(false)}
            >
              <Text style={styles.imageSourceBtnTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#1a1a2e" />
        ) : (
          <Text style={styles.buttonText}>Post</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  content: {
    padding: 16,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#eaeaea',
    marginBottom: 16,
  },
  caption: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photosLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  imageButton: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#1a1a2e',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#16213e',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 16,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  photoList: {
    marginTop: 12,
    marginBottom: 24,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removePhoto: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  imageSourceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSourceModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  imageSourceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#eaeaea',
    marginBottom: 4,
  },
  imageSourceSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
  },
  imageSourceBtn: {
    backgroundColor: '#e94560',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  imageSourceBtnCancel: {
    backgroundColor: 'transparent',
    marginTop: 4,
    marginBottom: 0,
  },
  imageSourceBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSourceBtnTextCancel: {
    color: '#9ca3af',
    fontSize: 16,
  },
});
