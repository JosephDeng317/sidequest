import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const POSTS_COLLECTION = 'posts';

export async function likePost(postId) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const likeRef = doc(db, POSTS_COLLECTION, postId, 'likes', uid);
  const existing = await getDoc(likeRef);
  if (existing.exists()) return;

  const postRef = doc(db, POSTS_COLLECTION, postId);
  await setDoc(likeRef, { userId: uid });
  await updateDoc(postRef, { likeCount: increment(1) });
}

export async function unlikePost(postId) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const likeRef = doc(db, POSTS_COLLECTION, postId, 'likes', uid);
  const existing = await getDoc(likeRef);
  if (!existing.exists()) return;

  const postRef = doc(db, POSTS_COLLECTION, postId);
  await deleteDoc(likeRef);
  await updateDoc(postRef, { likeCount: increment(-1) });
}

export function subscribeToIsLiked(postId, callback) {
  const uid = auth.currentUser?.uid;
  if (!uid || !postId) {
    callback(false);
    return () => {};
  }
  const likeRef = doc(db, POSTS_COLLECTION, postId, 'likes', uid);
  return onSnapshot(likeRef, (snapshot) => callback(snapshot.exists()));
}
