import { useState, useEffect, useContext } from "react";

import { useLocation, useRoutes } from "react-router";

// RPC Components
import { checkIfInstalled } from "utils/rpc";

import routes from "routes";

// Context
import AuthProvider from "context/Auth";
import { LucleRPC } from "context/Luclerpc";

export default function App() {
  const [isInstalled, setIsInstalled] = useState<boolean>();
  const client = useContext(LucleRPC);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    if (isLanding) {
      return;
    }

    checkIfInstalled(client)
      .then(() => {
        setIsInstalled(true);
      })
      .catch(() => {
        setIsInstalled(false);
      });
  }, [client, isLanding]);

  const resolvedIsInstalled = isLanding ? false : isInstalled;

  return (
    <AuthProvider>
      {resolvedIsInstalled !== undefined ? (
        <LucleRoutes isInstalled={resolvedIsInstalled} />
      ) : null}
    </AuthProvider>
  );
}

function LucleRoutes({ isInstalled }: { isInstalled: boolean }) {
  const content = useRoutes(routes(isInstalled));
  return <div>{content}</div>;
}
