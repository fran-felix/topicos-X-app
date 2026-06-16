import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';

const initialHabits = [
  { id: 'water', title: 'Drink water regularly', done: false },
  { id: 'teeth', title: 'Brush teeth every night', done: false },
  { id: 'walk', title: 'Go for a walk', done: false },
];

export default function App() {
  const [habits, setHabits] = useState(initialHabits);
  const [newHabit, setNewHabit] = useState('');

  const addHabit = () => {
    const trimmed = newHabit.trim();
    if (!trimmed) return;

    setHabits(current => [
      ...current,
      { id: `${Date.now()}`, title: trimmed, done: false },
    ]);
    setNewHabit('');
  };

  const toggleHabit = id => {
    setHabits(current =>
      current.map(habit =>
        habit.id === id ? { ...habit, done: !habit.done } : habit
      )
    );
  };

  const removeHabit = id => {
    setHabits(current => current.filter(habit => habit.id !== id));
  };

  const renderHabit = ({ item }) => (
    <View style={[styles.habitCard, item.done && styles.habitCardDone]}>
      <View style={styles.habitRow}>
        <Text style={[styles.habitTitle, item.done && styles.habitTitleDone]}>{item.title}</Text>
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
      <Text style={styles.description}>Create and maintain good daily habits.</Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={newHabit}
          onChangeText={setNewHabit}
          placeholder="Add a new habit"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={addHabit}
        />
        <TouchableOpacity onPress={addHabit} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={renderHabit}
        contentContainerStyle={styles.list}
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
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  habitTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  habitTitleDone: {
    textDecorationLine: 'line-through',
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
    marginLeft: 12,
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
});
