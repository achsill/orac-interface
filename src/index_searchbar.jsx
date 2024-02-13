import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; //added line
import UserInput from "./components/UserInput";

const container = document.getElementById("app"); // Ensure you have a div with id="app" in your index.html
const root = createRoot(container); // Create a root.
root.render(
  <div className="w-screen h-screen bg-stone-950 p-6">
    <UserInput isOriginExtanded={false} />
  </div>
);
