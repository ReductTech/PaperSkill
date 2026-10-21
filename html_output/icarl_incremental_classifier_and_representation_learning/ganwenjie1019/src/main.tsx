import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./shared/foundation/styles/kit.css";
import "./styles/paper.css";
import "./styles.css";
import "./styles/shell.css";
import "./styles/page-one.css";
import "./styles/page-two.css";
import "./styles/icarl-guided.css";
import "./styles/page-three.css";
import "./styles/page-four.css";
import "./styles/page-five.css";
import "./styles/page-six.css";
import "./styles/page-seven.css";
import "./styles/page-eight.css";
import "./styles/page-nine.css";
import "./styles/feature-chart.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing app root element.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
