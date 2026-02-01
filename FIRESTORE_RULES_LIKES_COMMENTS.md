# Firestore Rules for Likes and Comments

If you encounter permission errors when liking posts or adding comments, add these rules to your Firestore:

```
match /posts/{postId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null;  // needed for likeCount, commentCount
  allow delete: if request.auth.uid == resource.data.userId;
}

match /posts/{postId}/likes/{userId} {
  allow read: if request.auth != null;
  allow create, delete: if request.auth != null && request.auth.uid == userId;
}

match /posts/{postId}/comments/{commentId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
}

match /userStats/{userId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null && request.auth.uid == userId;
}
```

**Index required:** When you first add a comment, Firebase Console may prompt you to create an index for `comments` with field `createdAt` (ascending). Accept the prompt to create it.
