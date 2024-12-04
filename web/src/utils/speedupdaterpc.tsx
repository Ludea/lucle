const token = localStorage.getItem("token");
const headers = new Headers();
headers.set("Authorization", `Bearer ${token}`);

export const init = async (client: any, path: string, platforms: any) =>
  new Promise((resolve, reject) => {
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const key of subPath) {
      client
        .init(
          {
            path: path.concat("/", key),
          },
          { headers },
        )
        .then(() => resolve())
        .catch((error: any) => {
          reject(error);
        });
    }
  });

export const isInit = async (client: any, path: string, platforms: any) =>
  new Promise((resolve, reject) => {
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const key of subPath) {
      client
        .is_init(
          {
            path: path.concat("/", key),
          },
          { headers },
        )
        .then(() => {
          resolve();
        })
        .catch((error: string) => {
          reject(error);
        });
    }
  });

export const setCurrentVersion = async (
  client: any,
  path: string,
  version: string,
  platforms: any,
) =>
  new Promise((resolve, reject) => {
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const key of subPath) {
      client
        .set_current_version(
          {
            path: path.concat("/", key),
            version,
          },
          { headers },
        )
        .then(() => {
          resolve();
        })
        .catch((error: string) => {
          reject(error);
        });
    }
  });

export const registerVersion = async (
  client: any,
  path: string,
  version: string,
  description: string,
  platforms: any,
) =>
  new Promise((resolve, reject) => {
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const key of subPath) {
      client
        .register_version({
          path: path.concat("/", key),
          version,
          description,
        })
        .then(() => resolve())
        .catch((error: string) => reject(error));
    }
  });

export const unregisterVersion = async (
  client: any,
  path: string,
  version: string,
  platforms: any,
) =>
  new Promise((resolve, reject) => {
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const key of subPath) {
      client
        .unregister_version(
          {
            path: path.concat("/", key),
            version,
          },
          { headers },
        )
        .then(() => resolve())
        .catch((error: string) => reject(error));
    }
  });

export const registerPackage = async (
  client: any,
  path: string,
  name: string,
  platforms: any,
) =>
  new Promise((resolve, reject) => {
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const key of subPath) {
      client
        .register_package(
          {
            path: path.concat("/", key),
            name,
          },
          { headers },
        )
        .then(() => resolve())
        .catch((error: string) => reject(error));
    }
  });

export const unregisterPackage = async (
  client: any,
  path: string,
  name: string,
  platforms: any,
) =>
  new Promise((resolve, reject) => {
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const key of subPath) {
      client
        .unregister_package(
          {
            path: path.concat("/", key),
            name,
          },
          { headers },
        )
        .then(() => resolve())
        .catch((error: string) => reject(error));
    }
  });

export const fileToDelete = async (client: any, file: string, platforms: any) =>
  new Promise((resolve, reject) => {
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const key of subPath) {
      client
        .delete_file({ file: key.concat("/", file) })
        .then(() => resolve())
        .catch((error: string) => reject(error));
    }
  });
