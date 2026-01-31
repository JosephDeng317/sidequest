import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase';

const POSTS_COLLECTION = 'posts';

export async function createPost({ title, caption, imageUri }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  let photoUrl = null;
  if (imageUri) {
    const filename = `posts/${uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    const response = await fetch(imageUri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    photoUrl = await getDownloadURL(storageRef);
  }

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
    userId: uid,
    userEmail: auth.currentUser?.email ?? '',
    title: title.trim(),
    caption: caption.trim(),
    photoUrl,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeToPosts(callback) {
  const q = query(
    collection(db, POSTS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() ?? null,
    }));
    callback(posts);
  });
}
