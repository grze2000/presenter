const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getDisplays: () => ipcRenderer.invoke("get-displays"),
  getCategories: () => ipcRenderer.invoke("get-categories"),
  getSongs: (cat) => ipcRenderer.invoke("get-songs", cat),
  getSong: (id) => ipcRenderer.invoke("get-song", id),
  openFullscreen: (id) => ipcRenderer.invoke("open-fullscreen", id),
  closeFullscreen: () => ipcRenderer.invoke("close-fullscreen"),
  setFullscreenContent: (text) =>
    ipcRenderer.invoke("set-fullscreen-content", text),
  onFullscreenClosed: (cb) => ipcRenderer.on("fullscreen-closed", cb),
});
