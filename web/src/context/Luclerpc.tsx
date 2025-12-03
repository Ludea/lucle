import { ReactNode, createContext } from "react";

// RPC Connect
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { Lucle } from "gen/lucle_pb";

const LucleRPC = createContext();

function LucleRPCProvider({
  children,
  url,
}: {
  children: ReactNode;
  url: string;
}) {
  const transport = createGrpcWebTransport({
    baseUrl: `https://web.marlin-atlas.ts.net`,
  });
  const client = createClient(Lucle, transport);
  return <LucleRPC.Provider value={client}>{children}</LucleRPC.Provider>;
}

export { LucleRPCProvider, LucleRPC };
