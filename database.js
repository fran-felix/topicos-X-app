import { openDatabase } from 'expo-sqlite';

const db = openDatabase('habits.db');

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

const executeSqlAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
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
  });

export async function ensureDatabase() {
  return new Promise((resolve, reject) => {
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
  });
}

export async function loadHabits() {
  const result = await executeSqlAsync('SELECT * FROM habits ORDER BY id DESC;');
  const rows = result.rows._array || [];
  return rows.map(row => ({
    id: row.id.toString(),
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
  return result.insertId.toString();
}

export async function toggleHabitDone(id, done) {
  await executeSqlAsync('UPDATE habits SET done = ? WHERE id = ?;', [done ? 1 : 0, id]);
}

export async function removeHabit(id) {
  await executeSqlAsync('DELETE FROM habits WHERE id = ?;', [id]);
}
