// In your preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  send: (channel: any, data: any) => {
    let validChannels = [
      "user-input",
      "close-output-window",
      "close-input-window",
      "extend-input-window",
      "settings-button-clicked",
      "update-model",
      "close-setting-window",
      "minimize-search-window",
      "download-model",
      "switch-model-type",
      "select-model",
      "stop-download",
      "open-file-dialog",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: any, func: Function) => {
    let validChannels = [
      "ia-output",
      "ia-output-end",
      "ia-input",
      "installer-progression",
      "check-ia",
      "ia-error",
      "init-model-name",
      "send-clipboard-content",
      "download-data",
      "download-completed",
      "set-custom-model-path",
      "get-custom-model-path",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeListener: (channel: any, func: any) => {
    ipcRenderer.removeListener(channel, func);
  },
});
