import * as SQLite from 'expo-sqlite';

let db = null;

const initialHabits = [
  {
    title: 'Drink water regularly',
    frequency: 'daily',
    time: '08:00',
    goalDays: 30,
    done: false,
  },
  {
    title: 'Brush teeth every night',
    frequency: 'daily',
    time: '22:00',
    goalDays: 30,
    done: false,
  },
  {
    title: 'Go for a walk',
    frequency: 'weekly',
    time: '18:00',
    goalDays: 12,
    done: false,
  },
];

export async function ensureDatabase() {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('habits.db');
    }

    // Create table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        frequency TEXT NOT NULL,
        time TEXT NOT NULL,
        goalDays INTEGER NOT NULL,
        done INTEGER NOT NULL
      );
    `);

    // Check if table is empty and populate with initial data
    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM habits');
    const count = result?.count || 0;

    if (count === 0) {
      for (const item of initialHabits) {
        await db.runAsync(
          'INSERT INTO habits (title, frequency, time, goalDays, done) VALUES (?, ?, ?, ?, ?)',
          [item.title, item.frequency, item.time, item.goalDays, item.done ? 1 : 0]
        );
      }
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export async function loadHabits() {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('habits.db');
    }

    const rows = await db.getAllAsync('SELECT * FROM habits ORDER BY id DESC');
    return rows.map(row => ({
      id: String(row.id),
      title: row.title,
      frequency: row.frequency,
      time: row.time,
      goalDays: row.goalDays,
      done: row.done === 1,
    }));
  } catch (error) {
    console.error('Error loading habits:', error);
    return [];
  }
}


export async function addHabit(title, frequency, time, goalDays) {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('habits.db');
    }

    await db.runAsync(
      'INSERT INTO habits (title, frequency, time, goalDays, done) VALUES (?, ?, ?, ?, 0)',
      [title, frequency, time, goalDays]
    );
    
    // Get the ID of the newly inserted habit
    const result = await db.getFirstAsync(
      'SELECT id FROM habits WHERE title = ? AND frequency = ? AND time = ? AND goalDays = ? ORDER BY id DESC LIMIT 1',
      [title, frequency, time, goalDays]
    );
    
    return String(result?.id);
  } catch (error) {
    console.error('Error adding habit:', error);
    throw error;
  }
}

export async function toggleHabitDone(id, done) {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('habits.db');
    }

    await db.runAsync(
      'UPDATE habits SET done = ? WHERE id = ?',
      [done ? 1 : 0, parseInt(id)]
    );
  } catch (error) {
    console.error('Error toggling habit:', error);
    throw error;
  }
}

export async function removeHabit(id) {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('habits.db');
    }

    await db.runAsync('DELETE FROM habits WHERE id = ?', [parseInt(id)]);
  } catch (error) {
    console.error('Error removing habit:', error);
    throw error;
  }
}
