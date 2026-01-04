import { ReactNode, createContext } from "react";

// RPC Connect
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { Repo, Platforms, Options, Versions } from "gen/speedupdate_pb";

const SpeedupdateRPC = createContext();

function SpeedupdateRPCProvider({
  children,
  url,
}: {
  children: ReactNode;
  url: string;
}) {
  const transport = createGrpcWebTransport({
    baseUrl: `https://repo.marlin-atlas.ts.net`,
  });
  const client = createClient(Repo, transport);
  return (
    <SpeedupdateRPC.Provider value={client}>{children}</SpeedupdateRPC.Provider>
  );
}

export { SpeedupdateRPCProvider, SpeedupdateRPC };
