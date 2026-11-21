import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./ocean.css";
import "./premium.css";
import "./readability.css";
import "./viewport.css";
import "./actions.css";
import "./dashboard-visuals.css";

import './demo.css';
import { IS_DEMO } from './lib/demo';
if (IS_DEMO) {
  document.body.classList.add('demo-mode');
  if (!localStorage.getItem('techasset_preferences')) localStorage.setItem('techasset_preferences',JSON.stringify({theme:'light',scale:100}));
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
