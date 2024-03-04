import fs from "fs";
import path from "path";
import { homedir } from "os";
import os from "os";
import Downloader from "./Downloader";
import { ipcMain } from "electron";
import { windowManager } from "./WindowManager";
import nodeLlamaCpp, { LlamaChatSession, LlamaContext } from "node-llama-cpp";
import { getModelPath } from "./utils";
import { sendMessageToOutputWindow } from "./IpcHandlers";

export let session: LlamaChatSession | null = null;
export let context: LlamaContext | null = null;

export const modelInit = async () => {
  const { LlamaModel, LlamaContext, LlamaChatSession } = await nodeLlamaCpp;

  try {
    const modelFilePath = getModelPath();
    if (!modelFilePath) {
      sendMessageToOutputWindow(
        "ia-output",
        "Please, select a model first in the settings."
      );
      return;
    }

    const model = new LlamaModel({ modelPath: modelFilePath });
    context = new LlamaContext({ model });
    session = new LlamaChatSession({ context });
  } catch (error) {
    console.error(error);
  }
};

export async function findDownloadedModels() {
  const homeDirectory = homedir();

  try {
    const files = await fs.readdirSync(
      path.join(homeDirectory, ".orac", "models")
    );
    console.log("Files in the folder:", files);
    return {
      openchat: files.includes("openchat_3.5.Q6_K.gguf"),
      capybarahermes: files.includes("capybarahermes-2.5-mistral-7b.Q6_K.gguf"),
    };
  } catch (error) {
    console.error("Error reading the folder:", error);
    throw error;
  }
}

// Log the RAM in GB, rounding to two decimal places

export function calculateRecommandedModel() {
  const totalMemBytes = os.totalmem();
  const totalMemGB = totalMemBytes / Math.pow(1024, 3);
  const formattedMemGB = parseInt(totalMemGB.toFixed(2));

  if (formattedMemGB <= 16) {
    return "mistral";
  } else if (formattedMemGB > 16) {
    return "mixtral";
  }
}

ipcMain.on("download-model", async (event: any, modelName: string) => {
  let fileUrl;
  let fileName;
  if (modelName === "openchat") {
    fileUrl =
      "https://huggingface.co/TheBloke/openchat_3.5-GGUF/resolve/main/openchat_3.5.Q6_K.gguf";
    fileName = "openchat_3.5.Q6_K.gguf";
  } else if (modelName === "capybarahermes") {
    fileUrl =
      "https://huggingface.co/TheBloke/CapybaraHermes-2.5-Mistral-7B-GGUF/blob/main/capybarahermes-2.5-mistral-7b.Q5_K_M.gguf";
    fileName = "mixtral-8x7b-v0.1.Q3_K_M.gguf";
  }
  const homeDirectory = homedir();
  const downloader = Downloader.getInstance(windowManager);
  downloader.downloadFile(
    fileUrl,
    path.join(homeDirectory, ".orac", "models", fileName),
    modelName
  );
});
