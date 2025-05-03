import Database from "better-sqlite3";
import { app, BrowserWindow, ipcMain, screen } from "electron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const isDev = !app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("isDev", isDev);

const userDataPath = app.getPath("userData");
const userDbPath = path.join(userDataPath, "database.db");
const sourceDbPath = isDev
  ? path.join(__dirname, "data", "database.db")
  : path.join(process.resourcesPath, "src", "data", "database.db");

if (!fs.existsSync(path.dirname(userDbPath))) {
  fs.mkdirSync(path.dirname(userDbPath), { recursive: true });
}
if (!fs.existsSync(userDbPath)) {
  fs.copyFileSync(sourceDbPath, userDbPath);
}
const db = new Database(userDbPath);

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
    mainWin.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
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
