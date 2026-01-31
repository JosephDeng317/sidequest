import React, { useEffect, useState, useMemo } from 'react';
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
import { subscribeToFollowingIds } from '../services/follows';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function PostCard({ item, onPostPress, onAuthorPress }) {
  const photoUri = item.photoBase64
    ? `data:image/jpeg;base64,${item.photoBase64}`
    : null;
  const handleAuthorPress = () => {
    if (onAuthorPress && item.userId) onAuthorPress(item);
  };
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
        <View style={styles.cardMetaRow}>
          <TouchableOpacity onPress={handleAuthorPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.cardMetaAuthor}>{item.userEmail}</Text>
          </TouchableOpacity>
          <Text style={styles.cardMeta}>
            {' · '}{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

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
              <View style={styles.fullImageMetaRow}>
                {selectedPost?.userId ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPost(null);
                      navigation.navigate('UserProfile', {
                        userId: selectedPost.userId,
                        userEmail: selectedPost.userEmail,
                      });
                    }}
                  >
                    <Text style={styles.fullImageMetaAuthor}>{selectedPost?.userEmail}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.fullImageMeta}>{selectedPost?.userEmail}</Text>
                )}
                <Text style={styles.fullImageMeta}>
                  {' · '}
                  {selectedPost?.createdAt
                    ? new Date(selectedPost.createdAt).toLocaleDateString()
                    : ''}
                </Text>
              </View>
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
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  cardMetaAuthor: {
    fontSize: 12,
    color: '#e94560',
    fontWeight: '500',
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
  fullImageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fullImageMetaAuthor: {
    fontSize: 13,
    color: '#e94560',
    fontWeight: '500',
  },
  fullImageMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
});
