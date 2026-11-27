// Punkt wejścia buildu: React + biblioteki są w paczce (bez CDN), config.js ładuje się osobno przed paczką.
import "./decimal-input.js";
import React from "react";
import { createRoot } from "react-dom/client";
import CloudGate from "./cloud.js";
createRoot(document.getElementById("root")).render(React.createElement(CloudGate));
