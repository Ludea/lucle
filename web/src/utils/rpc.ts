import type { InstalledPlugin, InstallPluginRequest } from "gen/lucle_pb";
import type {
  WasmPluginRequest,
  WasmPluginReply,
} from "gen/lucle_pb";

export const checkIfInstalled = async (client: any) => client.is_database_created();

export const createDB = async (client: any, db: number, db_name: string, infos_connection: any) =>
  client.create_db({
    dbType: db,
    dbName: infos_connection.dbName,
    dbConnection: infos_connection,
  });

export const forgotPassword = async (client: any, user_mail: string) => {
  const { error } = await client.forgot_password({
    email: user_mail,
  });
  if (error) throw error;
};

export const connection = async (client: any, login: string, user_password: string) =>
  client.login({
    usernameOrEmail: login,
    password: user_password,
  });

export const createUser = async (
  client: any,
  login: string,
  user_password: string,
  user_mail: string,
  role: string,
) =>
  client.create_user({
    // TODO: delete this var
    database_path: "lucle.db",
    username: login,
    password: user_password,
    email: user_mail,
    role,
  });

export const registerUpdateServer = async (
  client: any,
  username: string,
  repo: string,
  platforms: any,
) =>
  client.register_update_server({
    path: repo,
    username,
    platforms,
  });

export const listRepositories = async (client: any, username: string) =>
  client.list_update_server_by_user({
    username,
  });

export const deleteRepo = async (client: any, path: string) =>
  client.delete_repo({
    path,
  });

export async function listPlugins(client: any): Promise<InstalledPlugin[]> {
  let res = client.listPlugins({});
  return res;
}

export async function installPlugin(
  client: any,
  req: InstallPluginRequest,
): Promise<InstalledPlugin> {
  return client.installPlugin(req);
}

export async function togglePlugin(client: any, id: string): Promise<InstalledPlugin> {
  return client.togglePlugin({ id });
}

export async function removePlugin(client: any, id: string): Promise<void> {
  client.removePlugin({ id });
}

export async function callWasmPlugin(
  client: any,
  req: WasmPluginRequest,
): Promise<WasmPluginReply> {
  return client.call_wasm_plugin(req);
}
