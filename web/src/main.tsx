import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// Material Dashboard 2 React Context Provider
import { MaterialUIControllerProvider } from "context";

// Context
import { LucleRPCProvider } from "context/Luclerpc";

import "regenerator-runtime";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <MaterialUIControllerProvider>
      <LucleRPCProvider>
        <App />
      </LucleRPCProvider>
    </MaterialUIControllerProvider>
  </BrowserRouter>,
);
