import { BrowserWindow, screen } from "electron";
import Downloader from "./Downloader";
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const OUTPUT_WINDOW_WEBPACK_ENTRY: string;
declare const SETTINGS_WINDOW_WEBPACK_ENTRY: string;

class WindowManager {
  searchWindow: BrowserWindow | null = null;
  outputWindow: BrowserWindow | null = null;
  settingsWindow: BrowserWindow | null = null;

  private createWindow(
    options: Electron.BrowserWindowConstructorOptions,
    url: string,
    windowProperty: keyof WindowManager
  ) {
    let window = new BrowserWindow(options);
    window.loadURL(url);
    window.on("closed", () => {
      if (this[windowProperty] === this.settingsWindow) {
        Downloader.getInstance(this).stopDownload();
      }
      this[windowProperty] = null;
    });
    return window;
  }

  createSearchWindow() {
    this.searchWindow = this.createWindow(
      {
        width: 560,
        height: 60,
        transparent: true,
        frame: false,
        type: "panel",
        resizable: true,
        webPreferences: {
          preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
          contextIsolation: true,
          nodeIntegration: false,
        },
      },
      MAIN_WINDOW_WEBPACK_ENTRY,
      "searchWindow"
    );
  }

  createOutputWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    this.outputWindow = this.createWindow(
      {
        width: 420,
        height: 420,
        x: width - 432,
        y: 0,
        type: "panel",
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        resizable: true,
        movable: true,
        webPreferences: {
          preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
          contextIsolation: true,
          nodeIntegration: false,
        },
      },
      OUTPUT_WINDOW_WEBPACK_ENTRY,
      "outputWindow"
    );
  }

  createSettingsWindow() {
    this.settingsWindow = this.createWindow(
      {
        // parent: this.outputWindow,
        width: 620,
        height: 520,
        titleBarStyle: "hidden",
        movable: true,
        resizable: false,
        webPreferences: {
          preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
          contextIsolation: true,
          nodeIntegration: false,
        },
      },
      SETTINGS_WINDOW_WEBPACK_ENTRY,
      "settingsWindow"
    );
    this.settingsWindow.webContents.openDevTools();
  }

  closeSearchWindow() {
    if (this.searchWindow) {
      this.searchWindow.close();
      this.searchWindow = null;
    }
  }

  minimizeSearchWindow() {
    if (this.searchWindow) {
      this.searchWindow.minimize();
    }
  }

  closeOutputWindow() {
    if (this.outputWindow) {
      this.outputWindow.close();
      this.outputWindow = null;
    }
  }

  closeSettingsWindow() {
    if (this.settingsWindow) {
      this.settingsWindow.close();
      this.settingsWindow = null;
    }
  }
}

export const windowManager = new WindowManager();
