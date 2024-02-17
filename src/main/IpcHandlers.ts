import { ipcMain } from "electron";
import { windowManager } from "./WindowManager";
import ollama from "ollama";
const Store = require("electron-store");
const store = new Store();

const sendMessageToOutputWindow = (
  messageType: string,
  messageContent: any
) => {
  windowManager.outputWindow?.webContents.send(messageType, messageContent);
};

const handleUserInput = async (input: string) => {
  if (!windowManager.outputWindow) {
    windowManager.createOutputWindow();
  }
  if (windowManager?.searchWindow) {
    windowManager.minimizeSearchWindow();
  }
  const modelName = store.get("modelName");
  sendMessageToOutputWindow("ia-input", input);
  if (modelName) {
    try {
      const message = {
        role: "user",
        content: input,
      };
      const response = await ollama.chat({
        model: store.get("modelName"),
        messages: [message],
        stream: true,
        keep_alive: -1,
      });

      for await (const part of response) {
        sendMessageToOutputWindow("ia-output", part.message.content);
      }

      sendMessageToOutputWindow("ia-output-end", null);
    } catch (e) {
      handleError(e);
    }
  } else {
    sendMessageToOutputWindow(
      "ia-error",
      "Go to the settings to configure the model you want to target."
    );
  }
};

const handleError = (e: any) => {
  console.error(e); // Log the full error

  let errorMessage = "An unexpected error occurred.";
  if (e.cause && e.cause.errno) {
    if (e.cause.errno === -61) {
      errorMessage =
        "Ollama seems to not be running, make sure that you installed Ollama correctly, and that Ollama is running (ollama run serve in terminal).";
    }
    // Add more specific error messages as needed
  } else if (/model '.*' not found, try pulling it first/.test(e.message)) {
    errorMessage =
      "The model you're trying to use has not been found, make sure to run ollama pull [model_name] first.";
  }

  sendMessageToOutputWindow("ia-error", errorMessage);
};

export function setupIpcHandlers() {
  ipcMain.on("user-input", async (event, input: string) => {
    await handleUserInput(input);
  });

  ipcMain.on("settings-button-clicked", async (event, input: string) => {
    windowManager.createSettingsWindow();
    windowManager.settingsWindow.webContents.once("dom-ready", () => {
      const modelName = store.get("modelName");
      if (modelName)
        windowManager.settingsWindow?.webContents.send(
          "init-model-name",
          modelName
        );
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

  ipcMain.on("close-input-window", async () => {
    windowManager.closeSearchWindow();
  });
}
