import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/paper-tokens.css";
import "./styles/base.css";
import "./styles/paper-components.css";
import "./styles/adaptiveisp.css";
import "./styles/inspatio/tokens.css";
import "./styles/inspatio/components.css";
import "./styles/inspatio-adapter.css";
import "./styles/paper.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
