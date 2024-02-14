import { app, BrowserWindow, ipcMain, screen, globalShortcut } from "electron";
import ollama from "ollama";
const { spawn } = require("child_process");
const Store = require("electron-store");

const store = new Store();
const path = require("path");
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const OUTPUT_WINDOW_WEBPACK_ENTRY: string;
declare const INSTALLER_WINDOW_WEBPACK_ENTRY: string;
const env = process.env.NODE_ENV || "development";

if (env === "development") {
  try {
    require("electron-reloader")(module, {
      debug: true,
      watchRenderer: true,
    });
  } catch (_) {
    console.log("Error");
  }
}
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null;
let outputWindow: BrowserWindow | null;
let installerWindow: BrowserWindow | null;

const createInstallerWindow = (): void => {
  const { width } = screen.getPrimaryDisplay().workAreaSize;

  installerWindow = new BrowserWindow({
    width: 420,
    height: 420,
    titleBarStyle: "hidden",
    movable: true,
    resizable: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  installerWindow.loadURL(INSTALLER_WINDOW_WEBPACK_ENTRY);
  installerWindow.on("closed", () => {
    installerWindow = null;
  });
};

const createWindow = (): void => {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = Math.max(400, Math.min(450, width));

  mainWindow = new BrowserWindow({
    width: 560,
    height: 60,
    transparent: true,
    frame: false,
    resizable: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.on("ready", () => {
  createWindow();
  // isOllamaInstalled();
  // installerFunc();
  const ret = globalShortcut.register("Command+`", () => {
    console.log("Command+` is pressed");

    if (!mainWindow) {
      createWindow();
    } else {
      mainWindow.focus();
    }
  });
  // mainWindow.webContents.openDevTools();

  if (!ret) {
    console.log("registration failed");
  }
  console.log(globalShortcut.isRegistered("Command+`"));
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("user-input", async (event, input: string) => {
  if (!outputWindow) {
    createOutputWindow();
    mainWindow.webContents.openDevTools();
  }

  if (mainWindow) {
    mainWindow.close();
  }

  setTimeout(() => {
    outputWindow?.webContents.send("ollama-input", input);
  }, 200);

  try {
    const message = { role: "user", content: input };
    const response = await ollama.chat({
      model: store.get("modelName"),
      messages: [message],
      stream: true,
      keep_alive: -1,
    });
    for await (const part of response) {
      outputWindow?.webContents.send("ollama-output", part.message.content);
    }

    outputWindow?.webContents.send("ollama-output-end");
  } catch (e) {
    if (e.cause && e.cause.errno) {
      console.log(e.cause.errno); // Log the errno for debugging
      // Handle specific errno. For ECONNREFUSED, errno is typically -61 on macOS and Linux, and might vary on Windows
      if (e.cause.errno === -61) {
        // Adjust the errno check as needed for your platform
        outputWindow?.webContents.send(
          "ollama-error",
          "Ollama seems to not be running, make sure that you installed Ollama correctly, and that Ollama is running (ollama run serve in terminal)."
        );
        console.log(
          "Custom Message: Unable to connect to the service. Please ensure the service is running on port 11434."
        );
      } else {
        // Handle other errnos or a default error message
        console.log("An unexpected error occurred.");
      }
    } else {
      const modelNotFoundPattern = /model '.*' not found, try pulling it first/;
      if (modelNotFoundPattern.test(e.message)) {
        outputWindow?.webContents.send(
          "ollama-error",
          "The model you're trying to use has not been found, make sure to run ollama pull [model_name] first."
        );
      } else {
        console.log(e);
      }
    }
  }
});

ipcMain.on("settings-button-clicked", async (event, input: string) => {
  createInstallerWindow();
  installerWindow.webContents.openDevTools();
  installerWindow.webContents.once("dom-ready", () => {
    const modelName = store.get("modelName");
    console.log(modelName);
    if (modelName)
      installerWindow?.webContents.send("init-model-name", modelName);
  });
  installerWindow.focus();
});

ipcMain.on("close-output-window", async (event, input: string) => {
  outputWindow?.close();
});

ipcMain.on("update-model", async (event, input: string) => {
  console.log("ici ouuuuu????");
  console.log(input);
  try {
    store.set("modelName", input);
  } catch (e) {
    console.log(e);
  }
});

ipcMain.on("extend-input-window", async (event, input: string) => {
  mainWindow.setSize(560, 420, true);
});

ipcMain.on("close-setting-window", async (event, input: string) => {
  installerWindow?.close();
});

ipcMain.on("close-input-window", async (event, input: string) => {
  mainWindow?.close();
});

function createOutputWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  outputWindow = new BrowserWindow({
    width: 420,
    height: 420,
    x: width - 432,
    y: 0,
    alwaysOnTop: true,
    transparent: true,
    titleBarStyle: "hidden",
    resizable: true,
    movable: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  outputWindow.loadURL(OUTPUT_WINDOW_WEBPACK_ENTRY);
  outputWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  outputWindow.webContents.openDevTools();
  outputWindow.on("closed", () => {
    outputWindow = null;
  });
}
