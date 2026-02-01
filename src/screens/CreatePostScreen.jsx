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
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { createPost } from '../services/posts';

export default function CreatePostScreen({ navigation }) {
  const route = useRoute();
  const questTitle = route.params?.questTitle ?? '';
  const questDescription = route.params?.questDescription ?? '';

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (questTitle) setTitle(questTitle);
    if (questDescription) setCaption(questDescription);
  }, [questTitle, questDescription]);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photos to add an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Missing title', 'Please enter a title for your post.');
      return;
    }
    setLoading(true);
    try {
      await createPost({
        title: trimmedTitle,
        caption: caption.trim(),
        imageUri: imageUri || null,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create post.');
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

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tap to add a photo</Text>
          </View>
        )}
      </TouchableOpacity>
      {imageUri ? (
        <TouchableOpacity onPress={() => setImageUri(null)}>
          <Text style={styles.removePhoto}>Remove photo</Text>
        </TouchableOpacity>
      ) : null}

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
  removePhoto: {
    color: '#e94560',
    fontSize: 14,
    marginBottom: 24,
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
});
