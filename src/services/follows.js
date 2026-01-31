import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const FOLLOWS_COLLECTION = 'follows';

// Firestore: ensure composite indexes exist for collection "follows":
// - field "followingId" (for follower count)
// - field "followerId" (for following count)
// Firebase Console will prompt to create them on first query if missing.

function followDocId(followerId, followingId) {
  return `${followerId}_${followingId}`;
}

export async function followUser(followingId) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  if (followingId === uid) return;

  const docRef = doc(db, FOLLOWS_COLLECTION, followDocId(uid, followingId));
  await setDoc(docRef, {
    followerId: uid,
    followingId,
    createdAt: serverTimestamp(),
  });
}

export async function unfollowUser(followingId) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const docRef = doc(db, FOLLOWS_COLLECTION, followDocId(uid, followingId));
  await deleteDoc(docRef);
}

export function subscribeToFollowerCount(userId, callback) {
  if (!userId) {
    callback(0);
    return () => {};
  }
  const q = query(
    collection(db, FOLLOWS_COLLECTION),
    where('followingId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => callback(snapshot.size));
}

export function subscribeToFollowingCount(userId, callback) {
  if (!userId) {
    callback(0);
    return () => {};
  }
  const q = query(
    collection(db, FOLLOWS_COLLECTION),
    where('followerId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => callback(snapshot.size));
}

export function subscribeToIsFollowing(followingId, callback) {
  const uid = auth.currentUser?.uid;
  if (!uid || !followingId) {
    callback(false);
    return () => {};
  }
  if (followingId === uid) {
    callback(false);
    return () => {};
  }
  const docRef = doc(db, FOLLOWS_COLLECTION, followDocId(uid, followingId));
  return onSnapshot(docRef, (snapshot) => callback(snapshot.exists()));
}

/** Returns list of user IDs that the given user follows. */
export function subscribeToFollowingIds(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, FOLLOWS_COLLECTION),
    where('followerId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const ids = snapshot.docs.map((d) => d.data().followingId).filter(Boolean);
    callback(ids);
  });
}
