import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { likePost, unlikePost, subscribeToIsLiked } from '../services/likes';

export default function PostCard({ item, onPostPress, onAuthorPress, showAuthorLink = true }) {
  const [isLiked, setIsLiked] = useState(false);
  const photoUri = item.photoBase64
    ? `data:image/jpeg;base64,${item.photoBase64}`
    : null;
  const likeCount = item.likeCount ?? 0;
  const commentCount = item.commentCount ?? 0;

  useEffect(() => {
    if (!item.id) return;
    return subscribeToIsLiked(item.id, setIsLiked);
  }, [item.id]);

  const handleLikePress = async () => {
    try {
      if (isLiked) await unlikePost(item.id);
      else await likePost(item.id);
    } catch (err) {
      // optional: show error
    }
  };

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
          {showAuthorLink ? (
            <TouchableOpacity onPress={handleAuthorPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.cardMetaAuthor}>{item.userEmail}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.cardMeta}>{item.userEmail}</Text>
          )}
          <Text style={styles.cardMeta}>
            {' · '}{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
          </Text>
        </View>
        <View style={styles.engagementRow}>
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={handleLikePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.likeIcon, isLiked && styles.likeIconActive]}>
              {isLiked ? '♥' : '♡'}
            </Text>
            <Text style={styles.engagementText}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
          </TouchableOpacity>
          <Text style={styles.engagementText}>
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardContent: { padding: 16 },
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
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#16213e',
    gap: 16,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeIcon: {
    fontSize: 18,
    color: '#6b7280',
  },
  likeIconActive: {
    color: '#e94560',
  },
  engagementText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
