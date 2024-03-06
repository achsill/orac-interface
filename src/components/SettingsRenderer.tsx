import React, { useState, useEffect } from "react";
import ModelSettings from "./ModelSettings";

const SettingsWindow: React.FC = () => {
  return (
    <div className="flex flex-col py-12 items-start text-white h-full w-full space-y-4 px-12">
      <div id="head" className="h-6 w-full fixed top-0"></div>
      <div className="flex w-fit gap-4 rounded-xl py-2">
        <button className="font-bold text-neutral-300">Models</button>
      </div>
      <ModelSettings />
    </div>
  );
};

export default SettingsWindow;
