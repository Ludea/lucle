import { useState, useEffect, useContext } from "react";
import { useLocation, useRoutes } from "react-router";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import { checkIfInstalled } from "utils/rpc";
import routes from "routes";
import AuthProvider from "context/Auth";
import { LucleRPC } from "context/Luclerpc";

export default function App() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const client    = useContext(LucleRPC);
  const location  = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    checkIfInstalled(client)
      .then(() => { setIsInstalled(true); })
      .catch(() => { setIsInstalled(false); });
  }, [client]);

  return (
    <AuthProvider>
     {isLanding ? (
        <LucleRoutes isInstalled={isInstalled ?? false} />
      ) : isInstalled === null ? (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <LucleRoutes isInstalled={isInstalled} />
      )}
    </AuthProvider>
  );
}

function LucleRoutes({ isInstalled }: { isInstalled: boolean }) {
  const content = useRoutes(routes(isInstalled));
  return <div>{content}</div>;
}
