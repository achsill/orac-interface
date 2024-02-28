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
    mistral: {
      isDownloaded: false,
      isSelected: false,
      isRecommanded: false,
    },
    llama: {
      isDownloaded: false,
      isSelected: false,
      isRecommanded: false,
    },
    mixtral: {
      isDownloaded: false,
      isSelected: false,
      isRecommanded: false,
    },
  });
  const [isDownloading, setIsDownloading] = useState(false);

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
        mistral: {
          isDownloaded: data.downloadedModels.mistral,
          isSelected: data.selectedModel === "mistral",
          isRecommanded: data.recommandedModel === "mistral",
        },
        llama: {
          isDownloaded: data.downloadedModels.llama,
          isSelected: data.selectedModel === "llama",
          isRecommanded: data.recommandedModel === "llama",
        },
        mixtral: {
          isDownloaded: data.downloadedModels.mixtral,
          isSelected: data.selectedModel === "mixtral",
          isRecommanded: data.recommandedModel === "mixtral",
        },
      };
      setModels(models);
      setModelName(data);
      setIsUsingCustomModel(data.isUsingCustomModel);
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

    window.api.receive("init-model-name", initModelName);
    window.api.receive("download-data", updateProgress);
    window.api.receive("download-completed", completeDownload);

    return () => {
      window.api.removeListener("init-model-name", initModelName);
      window.api.removeListener("download-data", updateProgress);
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
              <h1 className="text-l text-neutral-400 font-bold">Models</h1>
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
                modelName="Mistral"
                isDownloaded={models.mistral.isDownloaded}
                modelRef="mistral-7B-v0.1"
                isRecommanded={models.mistral.isRecommanded}
                onSelectModel={() => {
                  selectModel("mistral");
                }}
                downloadModel={() => {
                  downloadModel("mistral");
                }}
                isSelected={models.mistral.isSelected}
              />
              <ModelDownloadButton
                modelName="Llama"
                modelRef="llama-2-7b"
                isDownloaded={models.llama.isDownloaded}
                isRecommanded={models.llama.isRecommanded}
                onSelectModel={() => {
                  selectModel("llama");
                }}
                downloadModel={() => {
                  downloadModel("llama");
                }}
                isSelected={models.llama.isSelected}
              />
              <ModelDownloadButton
                modelName="Mixtral"
                modelRef="mixtral-8x7B-v0.1"
                isDownloaded={models.mixtral.isDownloaded}
                isRecommanded={models.mixtral.isRecommanded}
                onSelectModel={() => {
                  selectModel("mixtral");
                }}
                downloadModel={() => {
                  downloadModel("mixtral");
                }}
                isSelected={models.mixtral.isSelected}
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
            <input
              type="file"
              onChange={handleChange}
              className="bg-neutral-800 rounded p-2 w-3/4 focus:outline-none focus:border focus:border-neutral-700 border border-transparent"
              // value={modelName}
              placeholder="e.g. llama, mixtral"
            />
          </div>
          {/* <div className="flex gap-4">
            {" "}
            <div className="flex gap-2">
              <p>Mistral</p>
              <button onClick={downloadModel} className="">
                {" "}
                {models.includes(
                  "capybarahermes-2.5-mistral-7b.Q6_K.gguf"
                ) ? (
                  <p>hehe</p>
                ) : (
                  <ArrowDownOnSquareIcon className="h-4 w-4 text-white hover:text-purple-400" />
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <p>Llama</p>
              <button className="">
                {" "}
                <ArrowDownOnSquareIcon className="h-4 w-4 text-white hover:text-purple-400" />
              </button>
            </div>
            <div className="flex gap-2">
              <p>Mixtral</p>
              <button className="">
                {" "}
                <ArrowDownOnSquareIcon className="h-4 w-4 text-white hover:text-purple-400" />
              </button>
            </div>
          </div> */}
        </div>
        {/* <div className="flex flex-col">
          <p className="text-xs mb-2 text-neutral-500">Model name</p>

          <input
            type="text"
            onChange={handleChange}
            className="bg-neutral-800 rounded p-4 w-full focus:outline-none focus:border focus:border-neutral-700 border border-transparent"
            value={modelName}
            placeholder="e.g. llama, mixtral"
          />
        </div> */}
        {/* <button
          onClick={updateModel}
          className="text-xs p-3 bg-neutral-900 border cursor-pointer border-solid border-neutral-800 rounded hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-none"
        >
          Update
        </button> */}
      </div>
      {/* <p className="text-xs text-neutral-500">
        Make sure the model is already installed on your machine by running
        ollama pull [model_name].
      </p> */}
    </div>
  );
};

export default ModelSettings;
