import { app, BrowserWindow, globalShortcut, clipboard } from "electron";
import { windowManager } from "./main/WindowManager";
import { setupIpcHandlers, sendClipboardContent } from "./main/IpcHandlers";
import { modelInit } from "./main/Models";
import { updateElectronApp } from "update-electron-app";

function registerGlobalShortcuts() {
  globalShortcut.register("Ctrl+Space", () => {
    if (!windowManager.searchWindow) {
      windowManager.createSearchWindow();
    } else {
      windowManager.searchWindow.show();
    }
  });

  globalShortcut.register("Ctrl+Option+Space", () => {
    const clipboardContent = clipboard.readText("selection");
    if (!windowManager.searchWindow) {
      windowManager.createSearchWindow();
      sendClipboardContent(clipboardContent);
    } else {
      windowManager.searchWindow.show();
      sendClipboardContent(clipboardContent);
    }
  });
}

function setupAppLifecycle() {
  app.on("ready", async () => {
    windowManager.createSearchWindow();
    setupIpcHandlers();
    registerGlobalShortcuts();
    modelInit();
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

updateElectronApp();
setupAppLifecycle();
