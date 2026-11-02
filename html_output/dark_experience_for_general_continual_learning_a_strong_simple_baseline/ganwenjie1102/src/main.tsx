import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/components.css";
import "./shared/foundation/styles/kit.css";
import "./styles/paper.css";
import "./styles/diagram-placement.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root element");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
