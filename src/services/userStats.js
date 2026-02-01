import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const USER_STATS_COLLECTION = 'userStats';
const BASE_XP = 20;
const XP_PER_LEVEL = 100;

// Difficulty 1 = 1x, Difficulty 5 = 3x (linear interpolation)
function getDifficultyMultiplier(difficulty) {
  const d = Math.max(1, Math.min(5, Math.round(difficulty)));
  return 1 + ((d - 1) / 4) * 2;
}

function xpToLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

const DEFAULT_STATS = {
  globalXP: 0,
  globalLevel: 1,
  social: { xp: 0, level: 1, questsCompleted: 0 },
  fitness: { xp: 0, level: 1, questsCompleted: 0 },
  fun: { xp: 0, level: 1, questsCompleted: 0 },
};

const CATEGORY_TITLES = {
  social: ['Social Butterfly', 'People Person', 'Connector', 'Community Champion'],
  fitness: ['Fitness Fanatic', 'Gym Rat', 'Iron Will', 'Warrior'],
  fun: ['Fun Seeker', 'Joy Explorer', 'Adventure Seeker', 'Life Enthusiast'],
};

export function calculateXPFromQuest(difficulty) {
  const multiplier = getDifficultyMultiplier(difficulty ?? 2);
  return Math.round(BASE_XP * multiplier);
}

export async function updateStatsOnQuestComplete({ category, difficulty }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const cat = ['social', 'fitness', 'fun'].includes(category) ? category : 'fun';
  const xpGained = calculateXPFromQuest(difficulty);

  const statsRef = doc(db, USER_STATS_COLLECTION, uid);
  const snapshot = await getDoc(statsRef);

  if (!snapshot.exists()) {
    const newStats = {
      ...DEFAULT_STATS,
      [cat]: {
        xp: xpGained,
        level: xpToLevel(xpGained),
        questsCompleted: 1,
      },
      globalXP: xpGained,
      globalLevel: xpToLevel(xpGained),
    };
    await setDoc(statsRef, newStats);
    return;
  }

  const data = snapshot.data();
  const catData = data[cat] || { xp: 0, level: 1, questsCompleted: 0 };
  const newCatXP = (catData.xp || 0) + xpGained;
  const newGlobalXP = (data.globalXP || 0) + xpGained;

  await updateDoc(statsRef, {
    [`${cat}.xp`]: increment(xpGained),
    [`${cat}.questsCompleted`]: increment(1),
    [`${cat}.level`]: xpToLevel(newCatXP),
    globalXP: increment(xpGained),
    globalLevel: xpToLevel(newGlobalXP),
  });
}

export function subscribeToUserStats(userId, callback) {
  if (!userId) {
    callback(DEFAULT_STATS);
    return () => {};
  }
  const statsRef = doc(db, USER_STATS_COLLECTION, userId);
  return onSnapshot(statsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(DEFAULT_STATS);
      return;
    }
    const data = snapshot.data();
    const stats = {
      globalXP: data.globalXP ?? 0,
      globalLevel: data.globalLevel ?? 1,
      social: {
        xp: data.social?.xp ?? 0,
        level: data.social?.level ?? 1,
        questsCompleted: data.social?.questsCompleted ?? 0,
      },
      fitness: {
        xp: data.fitness?.xp ?? 0,
        level: data.fitness?.level ?? 1,
        questsCompleted: data.fitness?.questsCompleted ?? 0,
      },
      fun: {
        xp: data.fun?.xp ?? 0,
        level: data.fun?.level ?? 1,
        questsCompleted: data.fun?.questsCompleted ?? 0,
      },
    };
    callback(stats);
  });
}

export function getTitleForStats(stats) {
  const categories = ['social', 'fitness', 'fun'];
  let highestCat = 'fun';
  let highestXP = 0;

  for (const cat of categories) {
    const xp = stats[cat]?.xp ?? 0;
    if (xp > highestXP) {
      highestXP = xp;
      highestCat = cat;
    }
  }

  if (highestXP === 0) return 'Rookie Adventurer';

  const titles = CATEGORY_TITLES[highestCat];
  const level = stats[highestCat]?.level ?? 1;
  const index = Math.min(Math.floor(level / 5), titles.length - 1);
  return titles[index];
}
