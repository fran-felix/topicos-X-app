import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ensureDatabase,
  loadHabits,
  addHabit as addHabitToDb,
  toggleHabitDone,
  removeHabit as removeHabitFromDb,
} from './database';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';

const frequencyOptions = ['daily', 'weekly', 'monthly'];

export default function App() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [newFrequency, setNewFrequency] = useState('daily');
  const [newTime, setNewTime] = useState('08:00');
  const [newGoal, setNewGoal] = useState('30');

  useEffect(() => {
    setupStorage();
  }, []);

  const setupStorage = async () => {
    try {
      await ensureDatabase();
      const storedHabits = await loadHabits();
      setHabits(storedHabits);
    } catch (error) {
      console.error('Storage setup failed', error);
    }
  };

  const addHabit = async () => {
    const title = newHabit.trim();
    const time = newTime.trim();
    const goalDays = parseInt(newGoal, 10);

    if (!title) {
      Alert.alert('Validation', 'Please enter a habit name.');
      return;
    }
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      Alert.alert('Validation', 'Please use HH:MM format for time (24-hour).');
      return;
    }
    if (!goalDays || goalDays < 1) {
      Alert.alert('Validation', 'Please enter a goal of at least 1 day.');
      return;
    }

    try {
      const id = await addHabitToDb(title, newFrequency, time, goalDays);
      const nextHabit = {
        id,
        title,
        frequency: newFrequency,
        time,
        goalDays,
        done: false,
      };
      setHabits(current => [nextHabit, ...current]);
      setNewHabit('');
      setNewFrequency('daily');
      setNewTime('08:00');
      setNewGoal('30');
    } catch (error) {
      console.error('Could not add habit', error);
    }
  };

  const toggleHabit = async id => {
    const habit = habits.find(item => item.id === id);
    if (!habit) return;

    try {
      await toggleHabitDone(id, !habit.done);
      setHabits(current =>
        current.map(item =>
          item.id === id ? { ...item, done: !item.done } : item
        )
      );
    } catch (error) {
      console.error('Could not update habit', error);
    }
  };

  const removeHabit = async id => {
    try {
      await removeHabitFromDb(id);
      setHabits(current => current.filter(item => item.id !== id));
    } catch (error) {
      console.error('Could not remove habit', error);
    }
  };

  const renderHabit = ({ item }) => (
    <View style={[styles.habitCard, item.done && styles.habitCardDone]}>
      <View style={styles.habitRow}>
        <View style={styles.habitTextContainer}>
          <Text style={[styles.habitTitle, item.done && styles.habitTitleDone]}>{item.title}</Text>
          <Text style={styles.habitMeta}>
            {item.frequency} • {item.time} • {item.goalDays} days
          </Text>
        </View>
        <TouchableOpacity onPress={() => removeHabit(item.id)} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => toggleHabit(item.id)} style={styles.toggleButton}>
        <Text style={styles.toggleButtonText}>{item.done ? 'Mark undone' : 'Mark done'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Habit Tracker</Text>
      <Text style={styles.description}>Create and keep habits on your phone, even after restart.</Text>

      <View style={styles.fieldGroup}>
        <TextInput
          value={newHabit}
          onChangeText={setNewHabit}
          placeholder="Habit name"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={addHabit}
        />
      </View>

      <Text style={styles.sectionLabel}>Frequency</Text>
      <View style={styles.frequencyRow}>
        {frequencyOptions.map(option => (
          <TouchableOpacity
            key={option}
            onPress={() => setNewFrequency(option)}
            style={[
              styles.frequencyButton,
              newFrequency === option && styles.frequencyButtonActive,
            ]}
          >
            <Text
              style={[
                styles.frequencyButtonText,
                newFrequency === option && styles.frequencyButtonTextActive,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldGroup, styles.fieldHalf]}>
          <Text style={styles.sectionLabel}>Time (HH:MM)</Text>
          <TextInput
            value={newTime}
            onChangeText={setNewTime}
            placeholder="08:00"
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={[styles.fieldGroup, styles.fieldHalf, styles.goalField]}>
          <Text style={styles.sectionLabel}>Goal (days)</Text>
          <TextInput
            value={newGoal}
            onChangeText={setNewGoal}
            placeholder="30"
            style={styles.input}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <TouchableOpacity onPress={addHabit} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Habit</Text>
      </TouchableOpacity>

      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={renderHabit}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No habits yet. Add one above.</Text>}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  description: {
    color: '#4b5563',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#4b5563',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldHalf: {
    flex: 1,
  },
  goalField: {
    marginLeft: 12,
  },
  frequencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginRight: 8,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  frequencyButtonText: {
    color: '#111827',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  frequencyButtonTextActive: {
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 40,
  },
  habitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  habitCardDone: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  habitTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  habitTitleDone: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  habitMeta: {
    color: '#6b7280',
  },
  toggleButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  toggleButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#ef4444',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
});
