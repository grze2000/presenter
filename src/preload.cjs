const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getDisplays: () => ipcRenderer.invoke("get-displays"),
  getCurrentDisplayId: () => ipcRenderer.invoke("get-current-display-id"),
  getCategories: () => ipcRenderer.invoke("get-categories"),
  getSongs: (cat) => ipcRenderer.invoke("get-songs", cat),
  getSong: (id) => ipcRenderer.invoke("get-song", id),
  openFullscreen: (id) => ipcRenderer.invoke("open-fullscreen", id),
  closeFullscreen: () => ipcRenderer.invoke("close-fullscreen"),
  setFullscreenContent: (text) =>
    ipcRenderer.invoke("set-fullscreen-content", text),
  onFullscreenClosed: (cb) => {
    ipcRenderer.on("fullscreen-closed", cb);
    return () => ipcRenderer.removeListener("fullscreen-closed", cb);
  },
  onFullscreenKeyDown: (cb) => {
    const listener = (_event, code) => cb(code);
    ipcRenderer.on("fullscreen-keydown", listener);
    return () => ipcRenderer.removeListener("fullscreen-keydown", listener);
  },
  createSchedule: () => ipcRenderer.invoke("create-schedule"),
  getSchedules: () => ipcRenderer.invoke("get-schedules"),
  getScheduleSongs: (scheduleId) =>
    ipcRenderer.invoke("get-schedule-songs", scheduleId),
  removeSongFromSchedule: (scheduleSongId) =>
    ipcRenderer.invoke("remove-song-from-schedule", scheduleSongId),
  addSongToSchedule: (scheduleId, songId) =>
    ipcRenderer.invoke("add-song-to-schedule", scheduleId, songId),
  swapSchedulePositions: (idA, idB) =>
    ipcRenderer.invoke("swap-schedule-positions", idA, idB),
  saveSong: (song) => ipcRenderer.invoke("save-song", song),
  selectDisplay: (id) => ipcRenderer.invoke("select-display", id),
  openDisplaySelector: () => ipcRenderer.invoke("open-display-selector"),
  sendSlideControlAction: (action) =>
    ipcRenderer.send("slide-control-action", action),
  setSlideControlPresenting: (isPresenting) =>
    ipcRenderer.send("slide-control-presenting", Boolean(isPresenting)),
  onDisplaySelected: (cb) => {
    const listener = (_event, id) => cb(id);
    ipcRenderer.on("display-selected", listener);
    return () => ipcRenderer.removeListener("display-selected", listener);
  },
  onSlideControlAction: (cb) => {
    const listener = (_event, action) => cb(action);
    ipcRenderer.on("slide-control-action", listener);
    return () => ipcRenderer.removeListener("slide-control-action", listener);
  },
  onSlideControlPresenting: (cb) => {
    const listener = (_event, isPresenting) => cb(Boolean(isPresenting));
    ipcRenderer.on("slide-control-presenting", listener);
    return () =>
      ipcRenderer.removeListener("slide-control-presenting", listener);
  },
});
