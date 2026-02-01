import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { addComment, subscribeToComments } from '../services/comments';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PostDetailModal({ post, onClose, onNavigateToProfile, showAuthorLink = true }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (!post?.id) return;
    return subscribeToComments(post.id, setComments);
  }, [post?.id]);

  const handleAddComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || commentLoading) return;
    setCommentLoading(true);
    try {
      await addComment(post.id, trimmed);
      setCommentText('');
    } catch (err) {
      // optional: show error
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <Pressable style={styles.fullImageOverlay} onPress={onClose}>
      <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {post?.photoBase64 ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${post.photoBase64}` }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : null}
          <View style={styles.fullImageTextContainer}>
            <Text style={styles.fullImageTitle}>{post?.title}</Text>
            {post?.caption ? (
              <Text style={styles.fullImageCaption}>{post.caption}</Text>
            ) : null}
            <View style={styles.fullImageMetaRow}>
              {showAuthorLink && post?.userId ? (
                <TouchableOpacity onPress={() => onNavigateToProfile(post.userId, post.userEmail)}>
                  <Text style={styles.fullImageMetaAuthor}>By {post?.userEmail}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.fullImageMeta}>By {post?.userEmail}</Text>
              )}
              <Text style={styles.fullImageMeta}>
                {' · '}
                {post?.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
              </Text>
            </View>

            <Text style={styles.commentsSectionTitle}>Comments</Text>
            {comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{c.userEmail}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
                <Text style={styles.commentDate}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                </Text>
              </View>
            ))}
            {comments.length === 0 && (
              <Text style={styles.noComments}>No comments yet.</Text>
            )}
          </View>
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.commentInputRow}
        >
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#6b7280"
            value={commentText}
            onChangeText={setCommentText}
            multiline={false}
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.commentSubmitBtn, (!commentText.trim() || commentLoading) && styles.commentSubmitDisabled]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || commentLoading}
          >
            {commentLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.commentSubmitText}>Post</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>

        <TouchableOpacity style={styles.closeFullImage} onPress={onClose}>
          <Text style={styles.closeFullImageText}>Close</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  modalScroll: {
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  modalScrollContent: {
    paddingBottom: 100,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.4,
  },
  fullImageTextContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#eaeaea',
    marginTop: 20,
    marginBottom: 12,
  },
  commentItem: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  commentAuthor: {
    fontSize: 12,
    color: '#e94560',
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 11,
    color: '#6b7280',
  },
  noComments: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#16213e',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#eaeaea',
  },
  commentSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#e94560',
    borderRadius: 8,
  },
  commentSubmitDisabled: {
    opacity: 0.5,
  },
  commentSubmitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeFullImage: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#16213e',
    alignItems: 'center',
  },
  closeFullImageText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
});
