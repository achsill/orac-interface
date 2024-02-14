import React, { useState, useRef, useEffect } from "react";
import logo from "../assets/logo.png"; // Adjust the path as necessary

function InstallerWindow() {
  const [downloadInformations, setDownloadInformations] = useState({
    progress: 0,
    remainingTime: "0s",
  });
  const [isOllamaInstalled, setIsOllamaInstalled] = useState();
  const [modelName, setModelName] = useState("");
  const progressUpdate = (data) => {
    console.log(data);
    setDownloadInformations((prevState) => ({
      ...prevState,
      progress: parseFloat(data.progress), // Assuming data.progress is a string like "50%"
      remainingTime: data.remainingTime,
    }));
  };

  const handleChange = (event) => {
    const { value } = event.target;
    console.log("?");
    setModelName(value);
  };

  const updateModel = () => {
    window.api.send("update-model", modelName); // Call your function
    setModelName(modelName);
    closeWindow();
  };

  const closeWindow = () => {
    window.api.send("close-setting-window"); // Call your function
  };

  useEffect(() => {
    const checkOllamaInstallation = (data) => {
      console.log("hein?");
      console.log(data);
    };

    const initModelName = (data) => {
      console.log("??ca passe???");
      console.log(data);
      setModelName(data);
    };
    window.api.receive("check-ollama", checkOllamaInstallation);
    window.api.receive("init-model-name", initModelName);

    return () => {
      window.api.removeListener("check-ollama", checkOllamaInstallation); // Cleanup on component unmount
      window.api.removeListener("init-model-name"); // Cleanup on component unmount
    };
  }, []);

  return (
    <div className="flex flex-col justify-between py-12 items-center text-white h-full w-full space-y-4 px-12">
      <img className="h-9 w-9" src={logo}></img>
      <div className="flex flex-col w-full gap-2">
        <div className="flex flex-col">
          <p className="text-xs mb-2 text-neutral-500">Model name</p>
          <input
            type="text"
            onChange={handleChange}
            className="bg-neutral-800 rounded p-4 w-full focus:outline-none focus:border focus:border-neutral-700 border border-transparent"
            value={modelName}
            placeholder="eg: llama, mixtral"
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
        make sure the model is already installed on your machine by running
        ollama pull [model_name]
      </p>
    </div>
  );
}

export default InstallerWindow;
