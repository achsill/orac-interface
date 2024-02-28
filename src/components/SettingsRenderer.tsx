import React, { useState, useEffect } from "react";
import ModelSettings from "./ModelSettings";

const SettingsWindow: React.FC = () => {
  return (
    <div className="flex flex-col py-12 items-center text-white h-full w-full space-y-4 px-12">
      <div id="head" className="h-6 w-full fixed top-0"></div>
      <div className="flex w-fit gap-4 rounded-xl bg-neutral-800 py-2 px-4">
        <button className="font-bold text-pink-200">Models</button>
        <button>Settings</button>
      </div>
      <ModelSettings />
    </div>
  );
};

export default SettingsWindow;
