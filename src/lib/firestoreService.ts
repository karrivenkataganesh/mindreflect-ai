import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalInteraction } from '../types';

/**
 * Strips all undefined properties recursively from objects before persisting to Firestore.
 * Prevents "Function DocumentReference.setDoc() called with invalid data" runtime exceptions.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === undefined || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object' && obj !== null && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Returns a reference to a user's isolated interactions collection in Firestore:
 * Path: /users/{userId}/interactions
 */
export function getUserInteractionsCollection(userId: string) {
  return collection(db, 'users', userId, 'interactions');
}

/**
 * Subscribes to real-time updates of a user's journal interactions.
 */
export function subscribeToUserInteractions(
  userId: string,
  onUpdate: (interactions: JournalInteraction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const colRef = getUserInteractionsCollection(userId);
  const q = query(colRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: JournalInteraction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || 'Untitled Reflection',
          mood: data.mood || 'Reflective',
          turns: Array.isArray(data.turns) ? data.turns : [],
          summary: data.summary || null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          pinned: Boolean(data.pinned),
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Saves or updates a journal interaction document in Firestore under /users/{userId}/interactions/{interactionId}.
 * Ensures clean payload stripping and retry support.
 */
export async function saveUserInteraction(
  userId: string,
  interaction: JournalInteraction
): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to persist interaction.');
  }
  if (!interaction.id) {
    throw new Error('Interaction ID is required.');
  }

  const cleanPayload = stripUndefined({
    ...interaction,
    userId,
    updatedAt: Date.now(),
  });

  const docRef = doc(db, 'users', userId, 'interactions', interaction.id);
  await setDoc(docRef, cleanPayload, { merge: true });
}

/**
 * Deletes a journal interaction document from Firestore.
 */
export async function deleteUserInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  if (!userId || !interactionId) {
    throw new Error('Both userId and interactionId are required to delete.');
  }
  const docRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(docRef);
}

/**
 * Manually fetches all interactions (e.g. for backup or offline check).
 */
export async function fetchUserInteractions(userId: string): Promise<JournalInteraction[]> {
  if (!userId) return [];
  const colRef = getUserInteractionsCollection(userId);
  const q = query(colRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  const items: JournalInteraction[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    items.push({
      id: docSnap.id,
      userId: data.userId || userId,
      title: data.title || 'Untitled Reflection',
      mood: data.mood || 'Reflective',
      turns: Array.isArray(data.turns) ? data.turns : [],
      summary: data.summary || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      pinned: Boolean(data.pinned),
    });
  });
  return items;
}
