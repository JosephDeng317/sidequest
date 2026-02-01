import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { subscribeToPosts } from '../services/posts';
import PostCard from '../components/PostCard';
import PostDetailModal from '../components/PostDetailModal';

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
        onPress={() => navigation.navigate('SidequestOptions')}
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
            <PostCard
              item={item}
              onPostPress={setSelectedPost}
              onAuthorPress={(post) =>
                navigation.navigate('UserProfile', {
                  userId: post.userId,
                  userEmail: post.userEmail,
                })
              }
            />
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
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onNavigateToProfile={(userId, userEmail) => {
              setSelectedPost(null);
              navigation.navigate('UserProfile', { userId, userEmail });
            }}
          />
        )}
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
});
