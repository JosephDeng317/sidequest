import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { subscribeToPosts } from '../services/posts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function PostCard({ item, onPostPress }) {
  const photoUri = item.photoBase64
    ? `data:image/jpeg;base64,${item.photoBase64}`
    : null;
  return (
    <View style={styles.card}>
      {photoUri ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onPostPress(item)}>
          <Image source={{ uri: photoUri }} style={styles.cardImage} resizeMode="cover" />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={styles.cardContent}
        activeOpacity={0.9}
        onPress={() => onPostPress(item)}
      >
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.caption ? (
          <Text style={styles.cardCaption}>{item.caption}</Text>
        ) : null}
        <Text style={styles.cardMeta}>
          {item.userEmail} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToPosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Hey, {user?.email?.split('@')[0] ?? 'explorer'}</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.createButtonText}>+ New sidequest</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard item={item} onPostPress={setSelectedPost} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No posts yet. Create your first sidequest!</Text>
          }
        />
      )}

      <Modal
        visible={!!selectedPost}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPost(null)}
      >
        <Pressable
          style={styles.fullImageOverlay}
          onPress={() => setSelectedPost(null)}
        >
          <View style={styles.fullImageContainer}>
            {selectedPost?.photoBase64 ? (
              <Image
                source={{
                  uri: `data:image/jpeg;base64,${selectedPost.photoBase64}`,
                }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            ) : null}
            <View style={styles.fullImageTextContainer}>
              <Text style={styles.fullImageTitle}>{selectedPost?.title}</Text>
              {selectedPost?.caption ? (
                <Text style={styles.fullImageCaption}>{selectedPost.caption}</Text>
              ) : null}
              <Text style={styles.fullImageMeta}>
                {selectedPost?.userEmail} ·{' '}
                {selectedPost?.createdAt
                  ? new Date(selectedPost.createdAt).toLocaleDateString()
                  : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeFullImage}
              onPress={() => setSelectedPost(null)}
            >
              <Text style={styles.closeFullImageText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  welcome: {
    fontSize: 16,
    color: '#9ca3af',
  },
  logoutBtn: {
    padding: 8,
  },
  logoutText: {
    color: '#e94560',
    fontSize: 14,
  },
  createButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#e94560',
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#16213e',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#eaeaea',
    marginBottom: 4,
  },
  cardCaption: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  closeFullImage: {
    position: 'absolute',
    bottom: 48,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#e94560',
    borderRadius: 12,
  },
  closeFullImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fullImageTextContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '100%',
    maxWidth: SCREEN_WIDTH,
  },
  fullImageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#eaeaea',
    marginBottom: 6,
  },
  fullImageCaption: {
    fontSize: 15,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 22,
  },
  fullImageMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
});
