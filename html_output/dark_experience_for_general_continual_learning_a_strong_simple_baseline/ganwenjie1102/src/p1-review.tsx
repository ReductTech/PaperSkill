import React from "react";
import ReactDOM from "react-dom/client";
import P1ReviewPrototype from "./modules/review/P1ReviewPrototype";
import "./styles/tokens.css";
import "./styles/components.css";
import "./shared/foundation/styles/kit.css";
import "./styles/paper.css";
import "./styles/diagram-placement.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root element");

const scene = new URLSearchParams(window.location.search).get("scene");
ReactDOM.createRoot(root).render(
  <React.StrictMode><P1ReviewPrototype initialScene={scene} /></React.StrictMode>,
);
