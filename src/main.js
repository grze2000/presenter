const Database = require("better-sqlite3");
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const fs = require("fs");
const path = require("path");
const { initDatabase } = require("./utils/initDatabase.js");

const isDev = !app.isPackaged;

console.log("isDev", isDev);

const userDataPath = app.getPath("userData");
const userDbPath = path.join(userDataPath, "database.db");
const sourceDbPath = isDev
  ? path.join(__dirname, "..", "data", "database.db")
  : path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "data",
      "database.db"
    );

if (!fs.existsSync(path.dirname(userDbPath))) {
  fs.mkdirSync(path.dirname(userDbPath), { recursive: true });
}
if (!fs.existsSync(userDbPath)) {
  fs.copyFileSync(sourceDbPath, userDbPath);
}
const db = new Database(userDbPath);
initDatabase(db);

let fsWin = null;
let mainWin = null;
let displaySelectorWin = null;
let preferredDisplayId = null;

const openDisplaySelectorWindow = () => {
  if (displaySelectorWin && !displaySelectorWin.isDestroyed()) {
    displaySelectorWin.focus();
    return;
  }

  displaySelectorWin = new BrowserWindow({
    width: 420,
    height: 480,
    resizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    title: "Wybierz ekran",
    parent: mainWin ?? undefined,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  displaySelectorWin.on("closed", () => {
    displaySelectorWin = null;
  });

  displaySelectorWin.loadFile(
    path.join(__dirname, "..", "assets", "display-selector.html")
  );
};

const createWindow = () => {
  mainWin = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
    show: false,
  });

  mainWin.once("ready-to-show", () => {
    mainWin.maximize();
    mainWin.show();
  });

  if (isDev) {
    mainWin.loadURL("http://localhost:5173");
  } else {
    mainWin.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
};

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("get-displays", () => {
  const all = screen.getAllDisplays();
  if (!preferredDisplayId && all.length) {
    preferredDisplayId = all[0].id;
  }
  return all;
});
ipcMain.handle("get-current-display-id", () => preferredDisplayId);
ipcMain.handle("select-display", (_event, displayId) => {
  const exists = screen.getAllDisplays().some((d) => d.id === displayId);
  if (!exists) return { ok: false };

  preferredDisplayId = displayId;
  if (displaySelectorWin && !displaySelectorWin.isDestroyed()) {
    displaySelectorWin.close();
  }
  mainWin?.webContents.send("display-selected", displayId);
  return { ok: true };
});
ipcMain.handle("open-display-selector", () => {
  openDisplaySelectorWindow();
});
ipcMain.handle("get-categories", () =>
  db.prepare("SELECT * FROM categories").all()
);
ipcMain.handle("get-songs", (e, code) =>
  db.prepare("SELECT id, title FROM songs WHERE category_code = ?").all(code)
);
ipcMain.handle("get-song", (e, id) => {
  const rows = db
    .prepare(
      `
    SELECT s.id as song_id, s.title as song_title, s.category_code,
           v.number as verse_number, v.text as verse_text
    FROM songs s LEFT JOIN verses v ON s.id = v.song_id
    WHERE s.id = ? ORDER BY v.number ASC`
    )
    .all(id);
  if (!rows.length) return null;
  const song = {
    id: rows[0].song_id,
    title: rows[0].song_title,
    category_code: rows[0].category_code,
    verses: rows.map((r) => ({ number: r.verse_number, text: r.verse_text })),
  };
  return song;
});

ipcMain.handle("save-song", (e, song) => {
  const { id, title, category_code, verses } = song;

  if (id) {
    db.prepare("UPDATE songs SET title = ?, category_code = ? WHERE id = ?").run(
      title,
      category_code,
      id
    );
    db.prepare("DELETE FROM verses WHERE song_id = ?").run(id);
    const insert = db.prepare(
      "INSERT INTO verses (song_id, number, text) VALUES (?, ?, ?)"
    );
    const tx = db.transaction((verses) => {
      verses.forEach((v, i) => insert.run(id, i + 1, v.text));
    });
    tx(verses);
    return { id };
  } else {
    const info = db
      .prepare("INSERT INTO songs (title, category_code) VALUES (?, ?)")
      .run(title, category_code);
    const songId = info.lastInsertRowid;
    const insert = db.prepare(
      "INSERT INTO verses (song_id, number, text) VALUES (?, ?, ?)"
    );
    const tx = db.transaction((verses) => {
      verses.forEach((v, i) => insert.run(songId, i + 1, v.text));
    });
    tx(verses);
    return { id: songId };
  }
});

ipcMain.handle("open-fullscreen", (e, displayId) => {
  const display = screen.getAllDisplays().find((d) => d.id === displayId);
  if (!display) return;
  fsWin = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "fullscreen-preload.cjs"),
    },
  });
  fsWin.loadFile(path.join(__dirname, "../assets/fullscreen.html"));
  fsWin.on("closed", () => {
    fsWin = null;
    mainWin?.webContents.send("fullscreen-closed");
  });
});
ipcMain.handle("set-fullscreen-content", (e, text) => {
  if (fsWin) fsWin.webContents.send("fullscreen-content", text);
});
ipcMain.handle("close-fullscreen", () => {
  if (fsWin && !fsWin.isDestroyed()) fsWin.close();
});

ipcMain.on("fullscreen-keydown", (e, code) => {
  if (mainWin) {
    mainWin.webContents.send("fullscreen-keydown", code);
  }
});

ipcMain.handle("create-schedule", (e) => {
  const baseName = new Date().toLocaleDateString("pl-PL"); // "03.05.2025"
  let name = baseName;
  let counter = 1;

  while (true) {
    const exists = db
      .prepare("SELECT 1 FROM schedules WHERE name = ?")
      .get(name);
    if (!exists) break;
    name = `${baseName} #${counter++}`;
  }

  const stmt = db.prepare("INSERT INTO schedules (name) VALUES (?)");
  const info = stmt.run(name);
  return { id: info.lastInsertRowid, name };
});

ipcMain.handle("get-schedules", () => {
  return db
    .prepare(
      "SELECT id, name, created_at FROM schedules ORDER BY created_at DESC"
    )
    .all();
});

ipcMain.handle("get-schedule-songs", (e, scheduleId) => {
  const rows = db
    .prepare(
      `
    SELECT
      ss.id,           -- id wpisu (schedule_songs)
      ss.song_id,
      s.title,
      ss.position
    FROM schedule_songs ss
    JOIN songs s ON s.id = ss.song_id
    WHERE ss.schedule_id = ?
    ORDER BY ss.position ASC
  `
    )
    .all(scheduleId);

  return rows;
});

ipcMain.handle("add-song-to-schedule", (e, scheduleId, songId) => {
  // znajdź najwyższą istniejącą pozycję
  console.log("Adding song to schedule", scheduleId, songId);

  const result = db
    .prepare(
      `
    SELECT MAX(position) as maxPos
    FROM schedule_songs
    WHERE schedule_id = ?
  `
    )
    .get(scheduleId);

  const position = (result?.maxPos ?? 0) + 1;

  const stmt = db.prepare(`
    INSERT INTO schedule_songs (schedule_id, song_id, position)
    VALUES (?, ?, ?)
  `);

  const info = stmt.run(scheduleId, songId, position);

  return { id: info.lastInsertRowid, position };
});

ipcMain.handle("remove-song-from-schedule", (e, scheduleSongId) => {
  db.prepare("DELETE FROM schedule_songs WHERE id = ?").run(scheduleSongId);
});

ipcMain.handle("swap-schedule-positions", (e, idA, idB) => {
  const getPos = db.prepare(
    "SELECT id, position FROM schedule_songs WHERE id = ?"
  );
  const rowA = getPos.get(idA);
  const rowB = getPos.get(idB);

  const update = db.prepare(
    "UPDATE schedule_songs SET position = ? WHERE id = ?"
  );

  const tx = db.transaction(() => {
    update.run(rowB.position, rowA.id);
    update.run(rowA.position, rowB.id);
  });

  tx();
});
