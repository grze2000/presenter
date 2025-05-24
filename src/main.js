import Database from "better-sqlite3";
import { app, BrowserWindow, ipcMain, screen } from "electron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./utils/initDatabase.js";

const isDev = !app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("isDev", isDev);

const userDataPath = app.getPath("userData");
const userDbPath = path.join(userDataPath, "database.db");
const sourceDbPath = isDev
  ? path.join(__dirname, "data", "database.db")
  : path.join(process.resourcesPath, "data", "database.db");

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

ipcMain.handle("get-displays", () => screen.getAllDisplays());
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
