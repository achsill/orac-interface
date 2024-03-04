import { homedir } from "os";
import path from "path";
const Store = require("electron-store");
const store = new Store();

export const getModelPath = (): string | null => {
  const homeDirectory = homedir();
  const baseModelPath = path.join(homeDirectory, ".orac", "models");

  if (store.get("isUsingCustomModel")) {
    return store.get("customModelPath") || null;
  }

  const modelNameMap: { [key: string]: string } = {
    capybarahermes: "capybarahermes-2.5-mistral-7b.Q6_K.gguf",
    openchat: "openchat_3.5.Q6_K.gguf",
  };

  const modelName = store.get("selectedModel");
  return modelName ? path.join(baseModelPath, modelNameMap[modelName]) : null;
};
