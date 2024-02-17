import React from "react";
import { createRoot } from "react-dom/client";
import "./common/index.css"; //added line
import OutputRenderer from "./components/OutputRenderer";

const container = document.getElementById("app"); // Ensure you have a div with id="app" in your index.html
const root = createRoot(container); // Create a root.
root.render(<OutputRenderer />);
