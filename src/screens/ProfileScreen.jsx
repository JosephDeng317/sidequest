import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { subscribeToPosts } from '../services/posts';
import {
  followUser,
  unfollowUser,
  subscribeToFollowerCount,
  subscribeToFollowingCount,
  subscribeToIsFollowing,
} from '../services/follows';
import PostCard from '../components/PostCard';
import PostDetailModal from '../components/PostDetailModal';

export default function ProfileScreen({ navigation }) {
  const route = useRoute();
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const viewingUserId = route.params?.userId ?? user?.uid;
  const viewingUserEmail = route.params?.userEmail ?? user?.email;
  const isOwnProfile = viewingUserId === user?.uid;

  useEffect(() => {
    const unsubscribe = subscribeToPosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!viewingUserId) return;
    const un1 = subscribeToFollowerCount(viewingUserId, setFollowerCount);
    const un2 = subscribeToFollowingCount(viewingUserId, setFollowingCount);
    return () => {
      un1();
      un2();
    };
  }, [viewingUserId]);

  useEffect(() => {
    if (!viewingUserId || isOwnProfile) return;
    return subscribeToIsFollowing(viewingUserId, setIsFollowing);
  }, [viewingUserId, isOwnProfile]);

  const profilePosts = useMemo(() => {
    if (!viewingUserId) return [];
    return posts.filter((p) => p.userId === viewingUserId);
  }, [posts, viewingUserId]);

  const displayName = (viewingUserEmail ?? '').split('@')[0] || 'explorer';

  const handleFollowPress = async () => {
    if (followLoading || isOwnProfile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) await unfollowUser(viewingUserId);
      else await followUser(viewingUserId);
    } catch (err) {
      // optional: show error
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{isOwnProfile ? 'Profile' : displayName}</Text>
          <Text style={styles.subtitle}>
            {isOwnProfile ? displayName : viewingUserEmail}
          </Text>
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              <Text style={styles.countNumber}>{followerCount}</Text> followers
            </Text>
            <Text style={styles.countDivider}>·</Text>
            <Text style={styles.countText}>
              <Text style={styles.countNumber}>{followingCount}</Text> following
            </Text>
          </View>
        </View>
        {isOwnProfile ? (
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={handleFollowPress}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={[styles.followBtnText, isFollowing && styles.followingBtnText]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {isOwnProfile && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('SidequestOptions')}
        >
          <Text style={styles.createButtonText}>+ New sidequest</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      ) : (
        <FlatList
          data={profilePosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              item={item}
              onPostPress={setSelectedPost}
              showAuthorLink={false}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isOwnProfile
                ? "You haven't posted any sidequests yet. Create your first one!"
                : 'No posts yet.'}
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
            showAuthorLink={true}
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
    paddingVertical: 16,
    paddingTop: 8,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  backBtn: {
    marginRight: 12,
    paddingVertical: 8,
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: '#e94560',
    fontWeight: '600',
  },
  headerLeft: {
    flex: 1,
  },
  logoutBtn: {
    padding: 8,
  },
  logoutText: {
    color: '#e94560',
    fontSize: 14,
  },
  followBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#e94560',
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  followBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  followingBtnText: {
    color: '#e94560',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  countText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  countNumber: {
    fontWeight: '600',
    color: '#eaeaea',
  },
  countDivider: {
    color: '#6b7280',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#eaeaea',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
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
