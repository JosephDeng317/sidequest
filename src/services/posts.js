import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import * as ImageManipulator from 'expo-image-manipulator';
import { db, auth } from '../config/firebase';

const POSTS_COLLECTION = 'posts';

// Firestore document limit is 1MB. Resize + compress so base64 stays well under that.
const MAX_PHOTO_WIDTH = 800;
const JPEG_QUALITY = 0.6;

export async function createPost({ title, caption, imageUri, questCategory, questDifficulty, imageUris }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const uris = Array.isArray(imageUris) && imageUris.length > 0
    ? imageUris
    : imageUri ? [imageUri] : [];

  const photoBase64s = [];
  for (const uri of uris) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_PHOTO_WIDTH } }],
      {
        compress: JPEG_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );
    if (result.base64) photoBase64s.push(result.base64);
  }

  const postData = {
    userId: uid,
    userEmail: auth.currentUser?.email ?? '',
    title: title.trim(),
    caption: caption.trim(),
    photoBase64s: photoBase64s.length > 0 ? photoBase64s : null,
    createdAt: serverTimestamp(),
    likeCount: 0,
    commentCount: 0,
  };

  if (questCategory) postData.questCategory = questCategory;
  if (questDifficulty != null) postData.questDifficulty = questDifficulty;

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), postData);
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
