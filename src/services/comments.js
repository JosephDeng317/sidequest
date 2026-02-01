import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const POSTS_COLLECTION = 'posts';

export async function addComment(postId, text) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const trimmed = text.trim();
  if (!trimmed) return;

  const commentsRef = collection(db, POSTS_COLLECTION, postId, 'comments');
  await addDoc(commentsRef, {
    userId: uid,
    userEmail: auth.currentUser?.email ?? '',
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  const postRef = doc(db, POSTS_COLLECTION, postId);
  await updateDoc(postRef, { commentCount: increment(1) });
}

export function subscribeToComments(postId, callback) {
  if (!postId) {
    callback([]);
    return () => {};
  }
  const commentsRef = collection(db, POSTS_COLLECTION, postId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
      };
    });
    callback(comments);
  });
}
