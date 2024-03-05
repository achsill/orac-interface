import { homedir } from "os";
import path from "path";
const fs = require("fs");

const Store = require("electron-store");
const store = new Store();

export const getModelPath = (): string | null => {
  const homeDirectory = homedir();
  const baseModelPath = path.join(homeDirectory, ".orac", "models");

  console.log("heheyy2");
  if (store.get("isUsingCustomModel")) {
    const customModelPath = store.get("customModelPath");
    if (customModelPath && fs.existsSync(customModelPath)) {
      return customModelPath;
    }
    return null;
  }

  const modelNameMap: { [key: string]: string } = {
    capybarahermes: "capybarahermes-2.5-mistral-7b.Q5_K_M.gguf",
    openchat: "openchat_3.5.Q6_K.gguf",
  };

  const modelName = store.get("selectedModel");
  console.log("modelName: ", modelName);
  if (modelName) {
    const modelPath = path.join(baseModelPath, modelNameMap[modelName]);
    if (fs.existsSync(modelPath)) {
      return modelPath;
    }
  }

  return null;
};
