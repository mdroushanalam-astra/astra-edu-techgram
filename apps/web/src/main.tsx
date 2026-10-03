import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./v4/theme4.css";
import { App } from "./app.js";
import { Witness } from "./v4/witness.js";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Witness><App /></Witness>
  </React.StrictMode>,
);
