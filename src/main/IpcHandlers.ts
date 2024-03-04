import { ipcMain, dialog } from "electron";
import { windowManager } from "./WindowManager";
import {
  calculateRecommandedModel,
  context,
  findDownloadedModels,
  modelInit,
  session,
} from "./Models";

const Store = require("electron-store");
const store = new Store();

export const sendMessageToOutputWindow = (
  messageType: string,
  messageContent: string
) => {
  windowManager.outputWindow?.webContents.send(messageType, messageContent);
};

const sendMessages = async (input: string) => {
  if (!session) {
    console.error("Session not initialized.");
    return;
  }

  try {
    sendMessageToOutputWindow("ia-input", input);
    session.prompt(input, {
      onToken: (chunk: any[]) => {
        const decoded = context?.decode(chunk);
        if (decoded) sendMessageToOutputWindow("ia-output", decoded);
      },
    });
  } catch (error) {
    console.error(error);
  }
};

const handleUserInput = async (input: string) => {
  if (windowManager?.searchWindow) {
    windowManager.minimizeSearchWindow();
  }
  if (!windowManager.outputWindow) {
    windowManager.createOutputWindow();
    windowManager.outputWindow.webContents.once("dom-ready", () => {
      sendMessages(input);
    });
  } else {
    sendMessages(input);
  }
};

export const sendClipboardContent = async (clipboardContent: string) => {
  if (windowManager.outputWindow) {
    windowManager.outputWindow?.webContents.send(
      "send-clipboard-content",
      clipboardContent
    );
  } else {
    if (!windowManager.searchWindow) {
      windowManager.searchWindow.webContents.once("dom-ready", () => {
        windowManager.searchWindow?.webContents.send(
          "send-clipboard-content",
          clipboardContent
        );
      });
    } else {
      windowManager.searchWindow.on("show", () => {
        windowManager.searchWindow?.webContents.send(
          "send-clipboard-content",
          clipboardContent
        );
      });
    }
  }
};

export function setupIpcHandlers() {
  ipcMain.on("user-input", async (event, input: string) => {
    await handleUserInput(input);
  });

  ipcMain.on("settings-button-clicked", async (event, input: string) => {
    windowManager.createSettingsWindow();
    windowManager.settingsWindow.webContents.once("dom-ready", async () => {
      const modelName = store.get("modelName");
      const selectedModel = store.get("selectedModel");
      const isUsingCustomModel = store.get("isUsingCustomModel");
      const customModelPath = store.get("customModelPath");
      const downloadedModels = await findDownloadedModels();
      const recommandedModel = calculateRecommandedModel();
      if (modelName)
        windowManager.settingsWindow?.webContents.send("init-model-name", {
          isUsingCustomModel,
          modelName,
          downloadedModels,
          selectedModel,
          recommandedModel,
          customModelPath,
        });
    });
    windowManager.settingsWindow.focus();
  });

  ipcMain.on("update-model", async (event, input: string) => {
    try {
      store.set("modelName", input);
    } catch (e) {
      console.log(e);
    }
  });

  ipcMain.on("extend-input-window", async () => {
    windowManager.searchWindow.setSize(560, 420, true);
  });

  ipcMain.on("close-output-window", async () => {
    windowManager.closeOutputWindow();
  });

  ipcMain.on("close-setting-window", async () => {
    windowManager.closeSettingsWindow();
  });

  ipcMain.on("minimize-search-window", async () => {
    windowManager.minimizeSearchWindow();
  });

  ipcMain.on("select-model", async (event: any, modelName: string) => {
    store.set("selectedModel", modelName);
    modelInit();
  });

  ipcMain.on(
    "switch-model-type",
    async (event: any, isUsingCustomModel: boolean) => {
      store.set("isUsingCustomModel", isUsingCustomModel);
      modelInit();
    }
  );

  ipcMain.on("close-input-window", async () => {
    windowManager.closeSearchWindow();
  });
}

ipcMain.on("set-custom-model-path", async (event, modelPath: string) => {
  try {
    store.set("customModelPath", modelPath);
  } catch (e) {
    console.log(e);
  }
});

ipcMain.on("open-file-dialog", (event) => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "GGUF Files", extensions: ["gguf"] }],
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        store.set("customModelPath", result.filePaths[0]);
        modelInit();
        windowManager.settingsWindow?.webContents.send(
          "get-custom-model-path",
          result.filePaths[0]
        );
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
