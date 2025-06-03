function initDatabase(db) {
  // Kategorie
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS categories (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    `
  ).run();

  // Pieśni
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category_code TEXT,
        FOREIGN KEY (category_code) REFERENCES categories(code)
      )
    `
  ).run();

  // Zwrotki
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id INTEGER NOT NULL,
        number INTEGER NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs(id)
      )
    `
  ).run();

  // Harmonogramy
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `
  ).run();

  // Pieśni w harmonogramie
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS schedule_songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        song_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id),
        FOREIGN KEY (song_id) REFERENCES songs(id)
      )
    `
  ).run();
}

// Eksportuj w stylu CommonJS:
module.exports = { initDatabase };
