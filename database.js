let db = null;
let isWeb = false;

// Detect platform
if (typeof window !== 'undefined') {
  isWeb = true;
} else {
  try {
    const { openDatabase } = require('expo-sqlite');
    db = openDatabase('habits.db');
  } catch (e) {
    isWeb = true;
  }
}

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

// Web-based storage using localStorage
const webStorage = {
  habits: [],
  
  init() {
    try {
      const stored = localStorage.getItem('habits_db');
      this.habits = stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.habits = [];
    }
  },
  
  save() {
    try {
      localStorage.setItem('habits_db', JSON.stringify(this.habits));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  },
  
  query(sql, params = []) {
    if (sql.includes('CREATE TABLE')) {
      return { rows: { _array: [] } };
    }
    if (sql.includes('SELECT COUNT')) {
      return { rows: { _array: [{ count: this.habits.length }] } };
    }
    if (sql.includes('SELECT *')) {
      return { rows: { _array: this.habits } };
    }
    if (sql.includes('INSERT INTO')) {
      const id = this.habits.length > 0 ? Math.max(...this.habits.map(h => h.id)) + 1 : 1;
      const habit = {
        id,
        title: params[0],
        frequency: params[1],
        time: params[2],
        goalDays: params[3],
        done: params[4] ? 1 : 0,
      };
      this.habits.push(habit);
      this.save();
      return { insertId: id };
    }
    if (sql.includes('UPDATE')) {
      const id = parseInt(params[1]);
      const habit = this.habits.find(h => h.id === id);
      if (habit) {
        habit.done = params[0];
        this.save();
      }
      return {};
    }
    if (sql.includes('DELETE')) {
      const id = parseInt(params[0]);
      this.habits = this.habits.filter(h => h.id !== id);
      this.save();
      return {};
    }
    return { rows: { _array: [] } };
  },
};

const executeSqlAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      try {
        const result = webStorage.query(sql, params);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    } else {
      db.transaction(
        tx => {
          tx.executeSql(
            sql,
            params,
            (_, result) => resolve(result),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        error => reject(error),
        () => {} // onSuccess - transaction completed
      );
    }
  });
};

export async function ensureDatabase() {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      try {
        webStorage.init();
        if (webStorage.habits.length === 0) {
          webStorage.habits = initialHabits.map((item, idx) => ({
            id: idx + 1,
            ...item,
            done: item.done ? 1 : 0,
          }));
          webStorage.save();
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    } else {
      db.transaction(
        tx => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS habits (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              frequency TEXT NOT NULL,
              time TEXT NOT NULL,
              goalDays INTEGER NOT NULL,
              done INTEGER NOT NULL
            );`
          );
          tx.executeSql(
            'SELECT COUNT(*) AS count FROM habits;',
            [],
            (_, result) => {
              const count = result.rows.item(0).count;
              if (count === 0) {
                initialHabits.forEach(item => {
                  tx.executeSql(
                    'INSERT INTO habits (title, frequency, time, goalDays, done) VALUES (?, ?, ?, ?, ?);',
                    [item.title, item.frequency, item.time, item.goalDays, item.done ? 1 : 0]
                  );
                });
              }
            },
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        error => reject(error),
        () => resolve()
      );
    }
  });
}

export async function loadHabits() {
  const result = await executeSqlAsync('SELECT * FROM habits ORDER BY id DESC;');
  const rows = result.rows._array || [];
  return rows.map(row => ({
    id: String(row.id),
    title: row.title,
    frequency: row.frequency,
    time: row.time,
    goalDays: row.goalDays,
    done: row.done === 1,
  }));
}

export async function addHabit(title, frequency, time, goalDays) {
  const result = await executeSqlAsync(
    'INSERT INTO habits (title, frequency, time, goalDays, done) VALUES (?, ?, ?, ?, 0);',
    [title, frequency, time, goalDays]
  );
  return String(result.insertId);
}

export async function toggleHabitDone(id, done) {
  await executeSqlAsync('UPDATE habits SET done = ? WHERE id = ?;', [done ? 1 : 0, parseInt(id)]);
}

export async function removeHabit(id) {
  await executeSqlAsync('DELETE FROM habits WHERE id = ?;', [parseInt(id)]);
}
