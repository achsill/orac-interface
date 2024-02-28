import React from "react";
// Assuming you're using Heroicons for the download icon
import { ArrowDownOnSquareIcon } from "@heroicons/react/24/outline"; // Adjust the import path as necessary

interface ModelDownloadButtonProps {
  modelName: string;
  isDownloaded: boolean;
  isRecommanded: boolean;
  isSelected: boolean;
  modelRef: string;
  onSelectModel: (modelIdentifier: string) => void; // Function to handle model selection
  downloadModel: (modelIdentifier: string) => void;
}

const ModelDownloadButton: React.FC<ModelDownloadButtonProps> = ({
  modelName,
  isDownloaded,
  isSelected,
  modelRef,
  isRecommanded,
  onSelectModel,
  downloadModel,
}) => {
  return (
    <div className="p-4 bg-neutral-800 rounded-xl flex flex-col justify-between">
      <div className="flex gap-2 items-center">
        <p>{modelName}</p>
        {isDownloaded ? (
          <>
            <input
              type="radio"
              name="selectedModel"
              checked={isSelected}
              onChange={() => onSelectModel(modelName)}
              className="cursor-pointer"
            />
          </>
        ) : (
          <button onClick={() => downloadModel(modelName)} className="">
            <ArrowDownOnSquareIcon className="h-4 w-4 text-white hover:text-purple-400" />
          </button>
        )}
      </div>
      <div>
        {isRecommanded ? (
          <p className=" text-xs text-pink-200 rounded-xl">Recommanded</p>
        ) : (
          ""
        )}
        <p className="text-xs text-neutral-500">{modelRef}</p>
      </div>
    </div>
  );
};

export default ModelDownloadButton;
