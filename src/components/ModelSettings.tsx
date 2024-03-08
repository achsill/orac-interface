import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png"; // Adjust the path as necessary
import ModelDownloadButton from "./ModelButton";
import { CircleStackIcon, StopCircleIcon } from "@heroicons/react/24/outline"; // Adjust the import path as necessary

interface DownloadInformation {
  progress: number;
  remainingTime: string;
  speed: number;
}

declare global {
  interface Window {
    api: {
      send: (channel: string, data?: any) => void;
      receive: (channel: string, func: (data: any) => void) => void;
      removeListener: (channel: string, func?: (data: any) => void) => void;
    };
  }
}

const ModelSettings: React.FC = () => {
  const [downloadInformations, setDownloadInformations] =
    useState<DownloadInformation>({
      progress: 0,
      remainingTime: "0s",
      speed: 0,
    });
  const [downloadingModelName, setDownloadingModelName] = useState("");
  const [isUsingCustomModel, setIsUsingCustomModel] = useState(false);
  const [modelName, setModelName] = useState<string>("");
  const [models, setModels] = useState({
    capybarahermes: {
      isDownloaded: false,
      isSelected: false,
      isRecommanded: false,
    },
    openchat: {
      isDownloaded: false,
      isSelected: false,
      isRecommanded: false,
    },
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [customModelPath, setCustomModelPath] = useState("");

  const selectFile = () => {
    window.api.send("open-file-dialog");
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModelName(event.target.value);
  };

  const switchModelType = (newValue: boolean) => {
    setIsUsingCustomModel(newValue);
    window.api.send("switch-model-type", newValue);
  };

  const downloadModel = (model: string) => {
    window.api.send("download-model", model);
    setIsDownloading(true);
    console.log(model);
    setDownloadingModelName(model);
  };

  const selectModel = (model: string) => {
    console.log(model);
    window.api.send("select-model", model);

    type ModelKeys = keyof typeof models;
    const updatedModels = Object.keys(models).reduce((acc, key) => {
      const modelName = key as ModelKeys;

      acc[modelName] = {
        ...models[modelName],
        isSelected: modelName === model,
      };
      return acc;
    }, {} as typeof models);

    setModels(updatedModels);
  };

  const updateModel = () => {
    window.api.send("update-model", modelName);
    closeWindow();
  };

  const stopDownload = () => {
    window.api.send("stop-download");
    setIsDownloading(false);
  };

  const closeWindow = () => {
    window.api.send("close-setting-window");
  };

  const completeDownload = (modelName: string) => {
    const downloadedModelName = modelName as keyof typeof models;
    setIsDownloading(false);
    setDownloadInformations({
      progress: 0,
      remainingTime: "0s",
      speed: 0,
    });
    console.log(downloadedModelName);
    setModels((prevModels) => ({
      ...prevModels,
      [downloadedModelName]: {
        ...prevModels[downloadedModelName],
        isDownloaded: true,
      },
    }));
    setDownloadingModelName("");
  };

  useEffect(() => {
    const initModelName = (data: any) => {
      console.log(data);
      const models = {
        capybarahermes: {
          isDownloaded: data.downloadedModels.capybarahermes,
          isSelected: data.selectedModel === "capybarahermes",
          isRecommanded: data.recommandedModel === "capybarahermes",
        },
        openchat: {
          isDownloaded: data.downloadedModels.openchat,
          isSelected: data.selectedModel === "openchat",
          isRecommanded: data.recommandedModel === "openchat",
        },
      };
      setModels(models);
      setModelName(data.modelName);
      setIsUsingCustomModel(data.isUsingCustomModel);
      setCustomModelPath(data.customModelPath);
    };

    function sToTime(s: number): string {
      let seconds = s.toFixed(1);
      let minutes = (s / 60).toFixed(1);
      let hours = (s / (60 * 60)).toFixed(1);
      let days = (s / (60 * 60 * 24)).toFixed(1);

      if (parseFloat(seconds) < 60) return seconds + " Sec";
      else if (parseFloat(minutes) < 60) return minutes + " Min";
      else if (parseFloat(hours) < 24) return hours + " Hrs";
      else return days + " Days";
    }

    const updateProgress = (data: any) => {
      setDownloadInformations({
        progress: data.percentage.toFixed(2),
        remainingTime: sToTime(data.eta),
        speed: data.speed,
      });
    };

    const getCustomModelPath = (modelPath: string) => {
      console.log(modelPath);
      setCustomModelPath(modelPath);
    };

    window.api.receive("init-model-name", initModelName);
    window.api.receive("download-data", updateProgress);
    window.api.receive("download-completed", completeDownload);
    window.api.receive("get-custom-model-path", getCustomModelPath);

    return () => {
      window.api.removeListener("init-model-name", initModelName);
      window.api.removeListener("download-data", updateProgress);
      window.api.removeListener("download-completed", completeDownload);
      window.api.removeListener("get-custom-model-path", getCustomModelPath);
    };
  }, []);

  return (
    <div className="flex flex-col items-center text-white h-full w-full space-y-4">
      <div className="flex flex-col w-full gap-2">
        <div className="">
          <div
            className={
              isUsingCustomModel === false
                ? " border border-solid border-neutral-600 p-4 rounded-xl bg-neutral-900"
                : "p-4 rounded-xl bg-neutral-900"
            }
          >
            <div className="flex justify-between items-center  mb-2">
              <h1 className="text-l text-neutral-400 font-bold">
                Quick Install
              </h1>
              <input
                checked={isUsingCustomModel === false} // This ensures the radio button is checked if isUsingCustomModel is true
                onChange={() => switchModelType(false)}
                type="radio"
                name="selectedModelType"
                className="cursor-pointer"
              />
            </div>
            <div className="flex gap-4">
              <ModelDownloadButton
                modelName="capybarahermes"
                isDownloaded={models.capybarahermes.isDownloaded}
                modelRef="capybarahermes-2.5-mistral-7b"
                isRecommanded={models.capybarahermes.isRecommanded}
                onSelectModel={() => {
                  selectModel("capybarahermes");
                }}
                downloadModel={() => {
                  downloadModel("capybarahermes");
                }}
                isSelected={models.capybarahermes.isSelected}
              />
              <ModelDownloadButton
                modelName="Openchat"
                modelRef="openchat_3.5"
                isDownloaded={models.openchat.isDownloaded}
                isRecommanded={models.openchat.isRecommanded}
                onSelectModel={() => {
                  selectModel("openchat");
                }}
                downloadModel={() => {
                  downloadModel("openchat");
                }}
                isSelected={models.openchat.isSelected}
              />
            </div>
            {isDownloading ? (
              <div className="w-full flex justify-between  mt-4">
                <div className="flex text-sm gap-2">
                  <p>Downloading {downloadingModelName}:</p>
                  <p>
                    {" " +
                      downloadInformations.remainingTime +
                      " - " +
                      downloadInformations.progress +
                      "%"}{" "}
                  </p>
                </div>
                <button onClick={stopDownload}>
                  <StopCircleIcon className="h-4 w-4 text-white hover:text-purple-400" />
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
          <div
            className={
              isUsingCustomModel === true
                ? " border border-solid border-neutral-600 p-4  mt-4 rounded-xl bg-neutral-900"
                : "p-4 rounded-xl bg-neutral-900 mt-4"
            }
          >
            <div className="flex justify-between items-center  mb-2">
              <h1 className="text-l text-neutral-400 font-bold">
                Custom Model
              </h1>
              <input
                type="radio"
                className="cursor-pointer"
                checked={isUsingCustomModel === true} // This ensures the radio button is checked if isUsingCustomModel is true
                onChange={() => switchModelType(true)}
              />
            </div>
            <button
              className="bg-neutral-800 rounded p-2 w-3/4 focus:outline-none focus:border focus:border-neutral-700 border border-transparent"
              onClick={selectFile}
            >
              Custom Model
            </button>
            <p className="text-xs text-neutral-400 mt-4">{customModelPath}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSettings;
