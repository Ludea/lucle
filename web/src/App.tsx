import { useState, useEffect, useContext } from "react";

// react-router components
import { useRoutes } from "react-router-dom";

// RPC Components
import { checkIfInstalled } from "utils/rpc";

// Material Dashboard 2 React routes
import routes from "routes";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Material Dashboard 2 React themes
import theme from "assets/theme";

// Material Dashboard 2 React Dark Mode themes
import themeDark from "assets/theme-dark";

// Material Dashboard 2 React contexts
import { useMaterialUIController } from "context";

// Context
import AuthProvider from "context/Auth";
import { LucleRPC } from "context/Luclerpc";

export default function App() {
  const [isInstalled, setIsInstalled] = useState<boolean>();
  const client = useContext(LucleRPC);
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  useEffect(() => {
    checkIfInstalled(client)
      .then(() => {
        setIsInstalled(true);
      })
      .catch(() => {
        setIsInstalled(false);
      });
  }, []);

  return (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      <AuthProvider>
        {isInstalled !== undefined ? (
          <LucleRoutes isInstalled={isInstalled} />
        ) : null}
      </AuthProvider>
    </ThemeProvider>
  );
}

function LucleRoutes({ isInstalled }: { isInstalled: boolean }) {
  const content = useRoutes(routes(isInstalled));
  return <div>{content}</div>;
}
