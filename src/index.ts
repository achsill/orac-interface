import { app, BrowserWindow, globalShortcut } from "electron";
import { windowManager } from "./main/WindowManager";
import { setupIpcHandlers } from "./main/IpcHandlers";

function registerGlobalShortcuts() {
  const ret = globalShortcut.register("Ctrl+Space", () => {
    if (!windowManager.searchWindow) {
      windowManager.createSearchWindow();
    } else {
      windowManager.searchWindow.show();
    }
  });

  if (!ret) {
    console.error("Global shortcut registration failed");
  } else {
    console.log("Global shortcut registered successfully");
  }
}

function setupAppLifecycle() {
  app.on("ready", () => {
    windowManager.createSearchWindow();
    setupIpcHandlers();
    registerGlobalShortcuts();
    // app.dock.show();
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
      windowManager.createSearchWindow();
    }
  });
}

setupAppLifecycle();
