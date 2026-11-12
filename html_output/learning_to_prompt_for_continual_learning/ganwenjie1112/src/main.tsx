import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./shared/foundation/styles/kit.css";
import "./shared/foundation/styles/editorial.css";
import "./shared/core/reference/reference.css";
import "./styles/tokens.css";
import "./styles/components.css";
import "./styles/paper.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root element");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
