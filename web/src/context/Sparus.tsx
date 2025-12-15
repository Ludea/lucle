import { ReactNode, createContext } from "react";

// RPC Connect
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { event } from "gen/sparus_pb";

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
  });
  const client = createClient(event, transport);
  return <SparusRPC.Provider value={client}>{children}</SparusRPC.Provider>;
}

export { SparusRPCProvider, SparusRPC };
