const { contextBridge, ipcRenderer } = require("electron");

console.log("[fullscreen-preload] loaded");

contextBridge.exposeInMainWorld("fullscreen", {
  onContentUpdate: (callback) => {
    ipcRenderer.on("fullscreen-content", (_, content) => {
      console.log("[fullscreen-preload] received content:", content);
      callback(content);
    });
  },
});
