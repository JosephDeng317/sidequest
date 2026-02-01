import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import sidequestsData from '../data/sidequests.json';
import { generateSidequestFromLocation } from '../services/aiSidequest';

const CATEGORIES = ['fun', 'fitness', 'social'];
const MIN_MINUTES = 15;
const MAX_MINUTES = 120;

function getRandomQuest(sidequests, category, maxMinutes) {
  const filtered = sidequests.filter(
    (q) =>
      q.category === category && q.durationMinutes <= maxMinutes
  );
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function formatTime(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

export default function SidequestOptionsScreen({ navigation }) {
  const [category, setCategory] = useState('fun');
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [assignedQuest, setAssignedQuest] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const sidequests = useMemo(
    () => sidequestsData?.sidequests ?? [],
    []
  );

  const handleGetQuest = () => {
    const quest = getRandomQuest(sidequests, category, timeMinutes);
    if (quest) {
      setAssignedQuest(quest);
    } else {
      setAssignedQuest(null);
      // No matching quest - could show alert or try with more time
      const fallback = getRandomQuest(sidequests, category, MAX_MINUTES);
      setAssignedQuest(fallback ?? null);
    }
  };

  const handleFinishQuest = () => {
    if (assignedQuest) {
      navigation.replace('CreatePost', {
        questTitle: assignedQuest.title,
        questDescription: assignedQuest.description,
      });
    }
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAssignedQuest(null);
    try {
      const quest = await generateSidequestFromLocation(category, timeMinutes);
      setAssignedQuest(quest);
    } catch (err) {
      Alert.alert('AI sidequest failed', err.message || 'Something went wrong. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.categoryBtn, category === c && styles.categoryBtnActive]}
            onPress={() => {
              setCategory(c);
              setAssignedQuest(null);
            }}
          >
            <Text
              style={[
                styles.categoryBtnText,
                category === c && styles.categoryBtnTextActive,
              ]}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Time available</Text>
      <View style={styles.sliderRow}>
        <Text style={styles.timeValue}>{formatTime(timeMinutes)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={MIN_MINUTES}
          maximumValue={MAX_MINUTES}
          step={15}
          value={timeMinutes}
          onValueChange={(v) => {
            setTimeMinutes(Math.round(v));
            setAssignedQuest(null);
          }}
          minimumTrackTintColor="#e94560"
          maximumTrackTintColor="#16213e"
          thumbTintColor="#e94560"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>15 min</Text>
          <Text style={styles.sliderLabel}>2 hrs</Text>
        </View>
      </View>

      {!assignedQuest ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.getQuestBtn, aiLoading && styles.buttonDisabled]}
            onPress={handleGetQuest}
            disabled={aiLoading}
          >
            <Text style={styles.getQuestBtnText}>Get my sidequest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aiQuestBtn, aiLoading && styles.buttonDisabled]}
            onPress={handleGenerateAI}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <ActivityIndicator color="#1a1a2e" size="small" />
            ) : (
              <Text style={styles.aiQuestBtnText}>Generate AI sidequest</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.questCard}>
          <Text style={styles.questTitle}>{assignedQuest.title}</Text>
          <Text style={styles.questDescription}>{assignedQuest.description}</Text>
          <Text style={styles.questDuration}>
            ~{assignedQuest.durationMinutes ?? timeMinutes} min
          </Text>
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={handleFinishQuest}
          >
            <Text style={styles.finishBtnText}>Finish quest</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#16213e',
    alignItems: 'center',
  },
  categoryBtnActive: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
  },
  categoryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryBtnTextActive: {
    color: '#e94560',
  },
  sliderRow: {
    marginBottom: 32,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#eaeaea',
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  buttonRow: {
    gap: 12,
  },
  getQuestBtn: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  getQuestBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  aiQuestBtn: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e94560',
  },
  aiQuestBtnText: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  questCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  questTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#eaeaea',
    marginBottom: 12,
  },
  questDescription: {
    fontSize: 16,
    color: '#9ca3af',
    lineHeight: 24,
    marginBottom: 12,
  },
  questDuration: {
    fontSize: 14,
    color: '#e94560',
    fontWeight: '600',
    marginBottom: 24,
  },
  finishBtn: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
