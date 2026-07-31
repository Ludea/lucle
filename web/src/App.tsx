import { useState, useEffect, useContext } from "react";

import { useRoutes } from "react-router";

// RPC Components
import { checkIfInstalled } from "utils/rpc";

import routes from "routes";

// Context
import AuthProvider from "context/Auth";
import { LucleRPC } from "context/Luclerpc";

export default function App() {
  const [isInstalled, setIsInstalled] = useState<boolean>();
  const client = useContext(LucleRPC);

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
      <AuthProvider>
        {isInstalled !== undefined ? <LucleRoutes isInstalled={isInstalled} /> : null}
      </AuthProvider>
  );
}

function LucleRoutes({ isInstalled }: { isInstalled: boolean }) {
  const content = useRoutes(routes(isInstalled));
  return <div>{content}</div>;
}
