import { app, BrowserWindow, globalShortcut } from "electron";
import { windowManager } from "./main/WindowManager";
import { setupIpcHandlers } from "./main/IpcHandlers";

// function setupDevelopmentEnvironment() {
//   const env = process.env.NODE_ENV || "development";
//   if (env === "development") {
//     try {
//       require("electron-reloader")(module, {
//         debug: true,
//         watchRenderer: true,
//       });
//     } catch (error) {
//       console.error("Failed to load electron-reloader:", error);
//     }
//   }
// }

function registerGlobalShortcuts() {
  const ret = globalShortcut.register("Command+`", () => {
    console.log("Command+` is pressed");
    if (!windowManager.searchWindow) {
      windowManager.createSearchWindow();
    } else {
      windowManager.createSearchWindow();
      //  Logique à revoir !!
      // windowManager.searchWindow.focus();
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

// setupDevelopmentEnvironment();
setupAppLifecycle();
