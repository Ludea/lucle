import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Lucle } from "gen/lucle_connect";

export const connect = (url: string, port: string) => {
  const client = createPromiseClient(
    Lucle,
    createGrpcWebTransport({
      baseUrl: `http://${url}:${port}`,
    }),
  );
  return client;
};

export const checkIfInstalled = async (client: any) => {
  const { error } = await client.is_created_user({
    dbType: 2,
  });
  if (error) throw error;
};

export const dbConnection = async (client: any, db: number) => {
  const { error } = await client.create_db({
    dbType: db,
  });
  if (error) throw error;
};

export const forgotPassword = async (client: any, user_mail: string) => {
  const { error } = await client.forgot_password({
    email: user_mail,
  });
  if (error) throw error;
};

export const connection = async (
  client: any,
  login: string,
  user_password: string,
) => {
  const { error } = await client.login({
    username: login,
    password: user_password,
  });
  if (error) throw error;
};

export const createUser = async (
  client: any,
  login: string,
  user_password: string,
  user_mail: string,
) => {
  const { error } = await client.create_user({
    // TODO: delete this var
    database_path: "lucle.db",
    username: login,
    password: user_password,
    email: user_mail,
  });
  if (error) throw error;
};
