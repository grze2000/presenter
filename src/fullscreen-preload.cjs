const { contextBridge, ipcRenderer } = require("electron");

console.log("[fullscreen-preload] loaded");

contextBridge.exposeInMainWorld("fullscreen", {
  onContentUpdate: (callback) => {
    console.log("[fullscreen-preload] received content:", content);
    ipcRenderer.on("fullscreen-content", (_, content) => callback(content));
  },
});
