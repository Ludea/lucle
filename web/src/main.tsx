import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "App";

// Material Dashboard 2 React Context Provider
//import { MaterialUIControllerProvider } from "context";

// Context
import { LucleRPCProvider } from "context/Luclerpc";
import { SparusRPCProvider } from "context/Sparus";
import { SpeedupdateRPCProvider } from "context/Speedupdate";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <LucleRPCProvider>
      <SparusRPCProvider>
        <SpeedupdateRPCProvider>
          <App />
        </SpeedupdateRPCProvider>
      </SparusRPCProvider>
    </LucleRPCProvider>
  </BrowserRouter>,
);
