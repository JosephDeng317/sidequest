import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { subscribeToPosts } from '../services/posts';
import { subscribeToFollowingIds } from '../services/follows';
import PostCard from '../components/PostCard';
import PostDetailModal from '../components/PostDetailModal';

export default function FollowingScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToPosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToFollowingIds(user.uid, setFollowingIds);
  }, [user?.uid]);

  const followingIdsSet = useMemo(() => new Set(followingIds), [followingIds]);
  const followingPosts = useMemo(
    () => posts.filter((p) => p.userId && followingIdsSet.has(p.userId)),
    [posts, followingIdsSet]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Following</Text>
        <Text style={styles.subtitle}>Posts from people you follow</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      ) : (
        <FlatList
          data={followingPosts}
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
            <Text style={styles.empty}>
              Follow people from the Feed to see their posts here.
            </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 8,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#eaeaea',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
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
