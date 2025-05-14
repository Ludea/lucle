export const checkIfInstalled = async (client: any) =>
  new Promise((resolve, reject) => {
    client
      .is_database_created()
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });

export const createDB = async (
  client: any,
  db: number,
  db_name: string,
  infos_connection: any,
) =>
  new Promise((resolve, reject) => {
    client
      .create_db({
        dbType: db,
        dbName: infos_connection.dbName,
        dbConnection: infos_connection,
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });

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
) =>
  new Promise((resolve, reject) => {
    client
      .login({
        usernameOrEmail: login,
        password: user_password,
      })
      .then((user) => {
        resolve(user);
      })
      .catch((err) => {
        reject(err);
      });
  });

export const createUser = async (
  client: any,
  login: string,
  user_password: string,
  user_mail: string,
  role: string,
) =>
  new Promise((resolve, reject) => {
    client
      .create_user({
        // TODO: delete this var
        database_path: "lucle.db",
        username: login,
        password: user_password,
        email: user_mail,
        role,
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });

export const registerUpdateServer = async (
  client: any,
  username: string,
  repo: string,
  platforms: any,
) =>
  new Promise((resolve, reject) => {
    client
      .register_update_server({
        path: repo,
        username,
        platforms,
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });

export const listRepositories = async (client: any, username: string) =>
  new Promise((resolve, reject) => {
    client
      .list_update_server_by_user({
        username,
      })
      .then((list) => {
        resolve(list);
      })
      .catch((err) => {
        reject(err);
      });
  });

export const deleteRepo = async (client: any, path: string) =>
  new Promise((resolve, reject) => {
    client
      .delete_repo({
        path,
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
