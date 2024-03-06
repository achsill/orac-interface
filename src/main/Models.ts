import fs from "fs";
import path from "path";
import { homedir } from "os";
import os from "os";
import Downloader from "./Downloader";
import { ipcMain } from "electron";
import { windowManager } from "./WindowManager";
import nodeLlamaCpp, { LlamaChatSession, LlamaContext } from "node-llama-cpp";
import { getModelPath } from "../utils";
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
  const modelsPath = path.join(homeDirectory, ".orac", "models");

  if (!fs.existsSync(modelsPath)) {
    console.log("Models directory does not exist.");
    return {
      openchat: false,
      capybarahermes: false,
    };
  }

  try {
    const files = await fs.readdirSync(modelsPath);
    return {
      openchat: files.includes("openchat_3.5.Q6_K.gguf"),
      capybarahermes: files.includes(
        "capybarahermes-2.5-mistral-7b.Q5_K_M.gguf"
      ),
    };
  } catch (error) {
    console.error("Error reading the folder:", error);
    throw error;
  }
}

export function calculateRecommandedModel() {
  const totalMemBytes = os.totalmem();
  const totalMemGB = totalMemBytes / Math.pow(1024, 3);
  const formattedMemGB = parseInt(totalMemGB.toFixed(2));

  if (formattedMemGB <= 16) {
    return "capybarahermes";
  } else if (formattedMemGB > 16) {
    return "openchat";
  }
}

ipcMain.on("download-model", async (event: any, modelName: string) => {
  let fileUrl: string;
  let fileName: string;
  if (modelName === "openchat") {
    fileUrl =
      "https://huggingface.co/TheBloke/openchat_3.5-GGUF/resolve/main/openchat_3.5.Q6_K.gguf";
    fileName = "openchat_3.5.Q6_K.gguf";
  } else if (modelName === "capybarahermes") {
    fileUrl =
      "https://huggingface.co/TheBloke/CapybaraHermes-2.5-Mistral-7B-GGUF/resolve/main/capybarahermes-2.5-mistral-7b.Q5_K_M.gguf";
    fileName = "capybarahermes-2.5-mistral-7b.Q5_K_M.gguf";
  }

  const homeDirectory = homedir();
  const modelsDirectory = path.join(homeDirectory, ".orac", "models");

  // Check if the `.orac/models` directory exists, create it if not
  if (!fs.existsSync(modelsDirectory)) {
    fs.mkdirSync(modelsDirectory, { recursive: true });
  }

  const downloader = Downloader.getInstance(windowManager);
  downloader.downloadFile(
    fileUrl,
    path.join(modelsDirectory, fileName),
    modelName
  );
});
