import { BrowserWindow, screen } from "electron";
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const OUTPUT_WINDOW_WEBPACK_ENTRY: string;
declare const INSTALLER_WINDOW_WEBPACK_ENTRY: string;

class WindowManager {
  searchWindow: BrowserWindow | null = null;
  outputWindow: BrowserWindow | null = null;
  settingsWindow: BrowserWindow | null = null;

  private createWindow(
    options: Electron.BrowserWindowConstructorOptions,
    url: string
  ) {
    let window = new BrowserWindow(options);
    window.loadURL(url);
    window.on("closed", () => {
      window = null;
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
        resizable: true,
        webPreferences: {
          preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
          contextIsolation: true,
          nodeIntegration: false,
        },
      },
      MAIN_WINDOW_WEBPACK_ENTRY
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
      },
      OUTPUT_WINDOW_WEBPACK_ENTRY
    );
    this.outputWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    this.outputWindow.webContents.openDevTools();
    this.outputWindow.on("close", (e) => {
      console.log("ca close...");
      this.outputWindow = null;
    });
  }

  createSettingsWindow() {
    this.settingsWindow = this.createWindow(
      {
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
      },
      INSTALLER_WINDOW_WEBPACK_ENTRY
    );
    this.settingsWindow.webContents.openDevTools();
  }

  closeSearchWindow() {
    if (this.searchWindow) {
      this.searchWindow.close();
      this.searchWindow = null; // Explicitly set to null
    }
  }

  closeOutputWindow() {
    if (this.outputWindow) {
      this.outputWindow.close();
      this.outputWindow = null; // Explicitly set to null
    }
  }

  closeSettingsWindow() {
    if (this.settingsWindow) {
      this.settingsWindow.close();
      this.settingsWindow = null; // Explicitly set to null
    }
  }
}

export const windowManager = new WindowManager();
