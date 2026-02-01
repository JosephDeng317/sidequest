import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const isWeb = Platform.OS === 'web';
const cameraOptions = {
  mediaTypes: ['images'],
  allowsEditing: !isWeb,
  aspect: isWeb ? undefined : [4, 3],
  quality: 0.8,
};

export default function DoSidequestScreen({ navigation }) {
  const route = useRoute();
  const questTitle = route.params?.questTitle ?? '';
  const questDescription = route.params?.questDescription ?? '';
  const durationMinutes = route.params?.durationMinutes ?? 30;

  const [photos, setPhotos] = useState([]);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access to take photos during your sidequest.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync(cameraOptions);
      if (!result.canceled) {
        setPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (err) {
      Alert.alert('Camera error', err.message || 'Could not open camera.');
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinishQuest = () => {
    navigation.replace('CreatePost', {
      questTitle,
      questDescription,
      questPhotos: photos,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.descriptionCard}>
        <Text style={styles.questTitle}>{questTitle}</Text>
        <Text style={styles.duration}>~{durationMinutes} min</Text>
        <Text style={styles.questDescription}>{questDescription}</Text>
      </View>

      <Text style={styles.sectionLabel}>Photos from your sidequest</Text>
      <TouchableOpacity style={styles.takePhotoBtn} onPress={takePhoto}>
        <Text style={styles.takePhotoBtnText}>Take photo</Text>
      </TouchableOpacity>

      {photos.length > 0 ? (
        <View style={styles.photoGrid}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoWrap}>
              <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeThumb}
                onPress={() => removePhoto(index)}
              >
                <Text style={styles.removeThumbText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.finishBtn} onPress={handleFinishQuest}>
        <Text style={styles.finishBtnText}>Finish quest</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  descriptionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#16213e',
    marginBottom: 28,
  },
  questTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#eaeaea',
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    color: '#e94560',
    fontWeight: '600',
    marginBottom: 16,
  },
  questDescription: {
    fontSize: 16,
    color: '#9ca3af',
    lineHeight: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  takePhotoBtn: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e94560',
    marginBottom: 20,
  },
  takePhotoBtnText: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  photoWrap: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeThumb: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeThumbText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  finishBtn: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
