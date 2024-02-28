import { ipcMain } from "electron";
import { windowManager } from "./WindowManager";
import ollama from "ollama";
import { homedir } from "os";
import { fileURLToPath } from "url";
import nodeLlamaCpp, { Token } from "node-llama-cpp";
import path from "path";
import { calculateRecommandedModel, findDownloadedModels } from "./Models";
import Downloader from "./Downloader";

const Store = require("electron-store");
const store = new Store();

const sendMessageToOutputWindow = (
  messageType: string,
  messageContent: any
) => {
  windowManager.outputWindow?.webContents.send(messageType, messageContent);
};

const retrieveModelFilename = () => {
  const modelName = store.get("selectedModel");
  console.log(modelName);
  if (modelName === "llama") return "llama-2-7b.Q8_0.gguf";
  else if (modelName === "mistral") return "mistral-7b-v0.1.Q5_K_S.gguf";
  else if (modelName === "mixtral") return "mixtral-7b-v0.1.Q5_K_S.gguf";
};

async function aiHandler(input: string) {
  const { LlamaModel, LlamaContext, LlamaChatSession } =
    (await nodeLlamaCpp) as any as typeof import("node-llama-cpp");

  try {
    const homeDirectory = homedir();
    const model = new LlamaModel({
      modelPath: path.join(
        homeDirectory,
        ".orac",
        "models",
        retrieveModelFilename()
      ),
    });
    const context = new LlamaContext({ model });
    const session = new LlamaChatSession({ context });
    const a1 = await session.prompt(input, {
      onToken(chunk: Token[]) {
        sendMessageToOutputWindow("ia-output", context.decode(chunk));
      },
    });
  } catch (e) {
    console.log(e);
  }
}

const ollamaHandler = async (input: string) => {
  const modelName = store.get("modelName");

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

      ("~/.ollama/models");

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
      "Go to the settings to configure the model you want to use with the interface. Make sure you install it with Ollama before."
    );
  }
};

const sendMessages = async (input: string) => {
  sendMessageToOutputWindow("ia-input", input);
  try {
  } catch (e) {}

  aiHandler(input);
  // ollamaHandler(input);
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

const handleError = (e: any) => {
  console.error(e); // Log the full error

  let errorMessage = "An unexpected error occurred.";
  if (e.cause && e.cause.errno) {
    if (e.cause.errno === -61) {
      errorMessage =
        "Ollama seems to not be running, make sure that you installed Ollama correctly, and that Ollama is running (ollama run serve in terminal).";
    }
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
    windowManager.settingsWindow.webContents.once("dom-ready", async () => {
      const modelName = store.get("modelName");
      const selectedModel = store.get("selectedModel");
      const isUsingCustomModel = store.get("isUsingCustomModel");
      const downloadedModels = await findDownloadedModels();
      const recommandedModel = calculateRecommandedModel();
      if (modelName)
        windowManager.settingsWindow?.webContents.send("init-model-name", {
          isUsingCustomModel,
          modelName,
          downloadedModels,
          selectedModel,
          recommandedModel,
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

  ipcMain.on("download-model", async (event: any, modelName: string) => {
    let fileUrl;
    let fileName;
    if (modelName === "mistral") {
      fileUrl =
        "https://huggingface.co/TheBloke/Mistral-7B-v0.1-GGUF/resolve/main/mistral-7b-v0.1.Q5_K_S.gguf";
      fileName = "mistral-7b-v0.1.Q5_K_S.gguf";
    } else if (modelName === "mixtral") {
      fileUrl =
        "https://huggingface.co/TheBloke/Mixtral-8x7B-v0.1-GGUF/resolve/main/mixtral-8x7b-v0.1.Q3_K_M.gguf";
      fileName = "mixtral-8x7b-v0.1.Q3_K_M.gguf";
    } else if (modelName === "llama") {
      fileUrl =
        "https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q8_0.gguf";
      fileName = "llama-2-7b.Q8_0.gguf";
    }
    const homeDirectory = homedir();
    const downloader = Downloader.getInstance(windowManager);
    downloader.downloadFile(
      fileUrl,
      path.join(homeDirectory, ".orac", "models", fileName),
      modelName
    );
  });

  ipcMain.on("select-model", async (event: any, modelName: string) => {
    console.log("??" + modelName);
    store.set("selectedModel", modelName);
  });

  ipcMain.on(
    "switch-model-type",
    async (event: any, isUsingCustomModel: boolean) => {
      store.set("isUsingCustomModel", isUsingCustomModel);
    }
  );

  ipcMain.on("close-input-window", async () => {
    windowManager.closeSearchWindow();
  });
}
