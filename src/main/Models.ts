import fs from "fs";
import axios from "axios";
import progress from "progress-stream";
import path from "path";
import { homedir } from "os";
import { windowManager } from "./WindowManager";
import { ipcMain } from "electron";

export async function findDownloadedModels() {
  const homeDirectory = homedir();

  try {
    const files = await fs.readdirSync(
      path.join(homeDirectory, ".orac", "models")
    );
    console.log("Files in the folder:", files);
    return {
      mistral: files.includes("mistral-7b-v0.1.Q5_K_S.gguf"),
      llama: files.includes("llama-2-7b.Q8_0.gguf"),
      mixtral: files.includes("mixtral-8x7b-v0.1.Q3_K_M.gguf"),
    };
  } catch (error) {
    console.error("Error reading the folder:", error);
    throw error;
  }
}

import os from "os";

// Log the RAM in GB, rounding to two decimal places

export function calculateRecommandedModel() {
  const totalMemBytes = os.totalmem();
  const totalMemGB = totalMemBytes / Math.pow(1024, 3);
  const formattedMemGB = parseInt(totalMemGB.toFixed(2));

  if (formattedMemGB <= 8) return "llava";
  else if (formattedMemGB > 8 && formattedMemGB <= 16) {
    return "mistral";
  } else if (formattedMemGB > 16) {
    return "mixtral";
  }
}
