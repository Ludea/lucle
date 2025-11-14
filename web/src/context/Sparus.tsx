import { ReactNode, createContext } from "react";

// RPC Connect
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { Lucle } from "gen/lucle_pb";

const SparusRPC = createContext();

function SparusRPCProvider({
  children,
  url,
}: {
  children: ReactNode;
  url: string;
}) {
  const transport = createGrpcWebTransport({
    baseUrl: `https://web.marlin-atlas.ts.net`,
    //baseUrl: `http://localhost:8112`,
  });
  const client = createClient(Lucle, transport);
  return <SparusRPC.Provider value={client}>{children}</SparusRPC.Provider>;
}

export { SparusRPCProvider, SparusRPC };
