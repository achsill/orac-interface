import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png"; // Adjust the path as necessary

interface DownloadInformation {
  progress: number;
  remainingTime: string;
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

const SettingsWindow: React.FC = () => {
  const [downloadInformations, setDownloadInformations] =
    useState<DownloadInformation>({
      progress: 0,
      remainingTime: "0s",
    });
  const [isOllamaInstalled, setIsOllamaInstalled] = useState<
    boolean | undefined
  >(undefined);
  const [modelName, setModelName] = useState<string>("");

  const progressUpdate = (data: {
    progress: string;
    remainingTime: string;
  }) => {
    setDownloadInformations({
      progress: parseFloat(data.progress),
      remainingTime: data.remainingTime,
    });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModelName(event.target.value);
  };

  const updateModel = () => {
    window.api.send("update-model", modelName);
    closeWindow();
  };

  const closeWindow = () => {
    window.api.send("close-setting-window");
  };

  useEffect(() => {
    const checkOllamaInstallation = (data: boolean) => {
      setIsOllamaInstalled(data);
    };

    const initModelName = (data: string) => {
      setModelName(data);
    };

    window.api.receive("check-ollama", checkOllamaInstallation);
    window.api.receive("init-model-name", initModelName);

    return () => {
      window.api.removeListener("check-ollama", checkOllamaInstallation);
      window.api.removeListener("init-model-name", initModelName);
    };
  }, []);

  return (
    <div className="flex flex-col justify-between py-12 items-center text-white h-full w-full space-y-4 px-12">
      <img className="h-9 w-9" src={logo} alt="Logo" />
      <div className="flex flex-col w-full gap-2">
        <div className="flex flex-col">
          <p className="text-xs mb-2 text-neutral-500">Model name</p>
          <input
            type="text"
            onChange={handleChange}
            className="bg-neutral-800 rounded p-4 w-full focus:outline-none focus:border focus:border-neutral-700 border border-transparent"
            value={modelName}
            placeholder="e.g. llama, mixtral"
          />
        </div>
        <button
          onClick={updateModel}
          className="text-xs p-3 bg-neutral-900 border cursor-pointer border-solid border-neutral-800 rounded hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-none"
        >
          Update
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        Make sure the model is already installed on your machine by running
        ollama pull [model_name].
      </p>
    </div>
  );
};

export default SettingsWindow;
