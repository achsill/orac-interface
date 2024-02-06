// In your preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  send: (channel: any, data: any) => {
    // Only allow sending messages for specific channels for security
    let validChannels = [
      "user-input",
      "close-output-window",
      "close-input-window",
      "extend-input-window",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: any, func: Function) => {
    let validChannels = ["ollama-output", "ollama-output-end", "ollama-input"];
    if (validChannels.includes(channel)) {
      console.log(channel);
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeListener: (channel: any, func: any) => {
    ipcRenderer.removeListener(channel, func);
  },
});
