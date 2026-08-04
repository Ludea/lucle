import { ReactNode, createContext } from "react";

// RPC Connect
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { Repo } from "gen/speedupdate_pb";

const SpeedupdateRPC = createContext<any>(undefined);

function SpeedupdateRPCProvider({ children }: { children: ReactNode }) {
  const transport = createGrpcWebTransport({
    baseUrl: `https://repo.marlin-atlas.ts.net`,
  });
  const client = createClient(Repo, transport);
  return <SpeedupdateRPC.Provider value={client}>{children}</SpeedupdateRPC.Provider>;
}

export { SpeedupdateRPCProvider, SpeedupdateRPC };
