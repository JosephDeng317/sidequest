import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeToUserStats, getTitleForStats } from '../services/userStats';

const CATEGORIES = [
  { key: 'social', label: 'Social', icon: 'account-group', color: '#e94560' },
  { key: 'fitness', label: 'Fitness', icon: 'dumbbell', color: '#22c55e' },
  { key: 'fun', label: 'Fun', icon: 'gamepad-variant', color: '#3b82f6' },
];

const MAX_XP_FOR_BAR = 500;

function ProgressBar({ value, max, color }) {
  const pct = Math.min(1, (value || 0) / max);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const DEFAULT_STATS = {
  globalLevel: 1,
  social: { xp: 0, level: 1, questsCompleted: 0 },
  fitness: { xp: 0, level: 1, questsCompleted: 0 },
  fun: { xp: 0, level: 1, questsCompleted: 0 },
};

export default function StatCard({ userId }) {
  const [stats, setStats] = React.useState(DEFAULT_STATS);

  React.useEffect(() => {
    if (!userId) {
      setStats(DEFAULT_STATS);
      return;
    }
    return subscribeToUserStats(userId, setStats);
  }, [userId]);

  const title = getTitleForStats(stats);
  const maxCategoryXP = Math.max(
    stats.social?.xp ?? 0,
    stats.fitness?.xp ?? 0,
    stats.fun?.xp ?? 0,
    1
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Character Stats</Text>
        <View style={styles.titleBadge}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        <View style={styles.globalLevelRow}>
          <Text style={styles.globalLevelLabel}>Global Level</Text>
          <Text style={styles.globalLevelValue}>{stats.globalLevel ?? 1}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {CATEGORIES.map(({ key, label, icon, color }) => {
          const catStats = stats[key] || { xp: 0, level: 1, questsCompleted: 0 };
          const xp = catStats.xp ?? 0;
          const quests = catStats.questsCompleted ?? 0;

          return (
            <View key={key} style={styles.statRow}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
                <Text style={[styles.statLabel, { color }]}>{label}</Text>
              </View>
              <ProgressBar value={xp} max={Math.max(MAX_XP_FOR_BAR, maxCategoryXP)} color={color} />
              <View style={styles.statMeta}>
                <Text style={styles.statLevel}>Lv.{catStats.level ?? 1}</Text>
                <Text style={styles.statQuests}>{quests} quests</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#16213e',
    overflow: 'hidden',
  },
  cardHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#eaeaea',
    marginBottom: 10,
  },
  titleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e94560',
  },
  globalLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  globalLevelLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  globalLevelValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#eaeaea',
  },
  statsGrid: {
    gap: 18,
  },
  statRow: {},
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#16213e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLevel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  statQuests: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
