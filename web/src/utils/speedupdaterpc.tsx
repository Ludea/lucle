const token = localStorage.getItem("token");
const headers = new Headers();
headers.set("Authorization", `Bearer ${token}`);

export const init = async (client: any, path: string, platforms: any) =>
  new Promise((resolve, reject) => {
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const folder of subPath) {
      client
        .init(
          {
            path: path.concat("/", folder),
          },
          { headers },
        )
        .then(() => {
          resolve();
        })
        .catch((error: any) => {
          reject(error);
        });
    }
  });

export const isInit = async (client: any, path: string, platforms: any) =>
  new Promise((resolve, reject) => {
    for (const folder of platforms) {
      client
        .is_init(
          {
            path: path.concat("/", folder),
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
    for (const folder of platforms) {
      client
        .set_current_version(
          {
            path: path.concat("/", folder),
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
    for (const folder of platforms) {
      client
        .register_version({
          path: path.concat("/", folder),
          version,
          description,
        })
        .then(() => {
          resolve();
        })
        .catch((error: string) => {
          reject(error);
        });
    }
  });

export const unregisterVersion = async (
  client: any,
  path: string,
  version: string,
  platforms: any,
) =>
  new Promise((resolve, reject) => {
    for (const folder of platforms) {
      client
        .unregister_version(
          {
            path: path.concat("/", folder),
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

export const registerPackage = async (
  client: any,
  path: string,
  name: string,
  platforms: any,
) =>
  new Promise((resolve, reject) => {
    for (const folder of platforms) {
      client
        .register_package(
          {
            path: path.concat("/", folder),
            name,
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

export const unregisterPackage = async (
  client: any,
  path: string,
  name: string,
  platforms: any,
) =>
  new Promise((resolve, reject) => {
    for (const folder of platforms) {
      client
        .unregister_package(
          {
            path: path.concat("/", folder),
            name,
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

export const repoToDelete = async (client: any, path: string) => {
  new Promise((resolve, reject) => {
    client
      .delete_repo({ path: path })
      .then(() => {
        resolve();
      })
      .catch((error: string) => {
        reject(error);
      });
  });
};

export const fileToDelete = async (client: any, file: string, platforms: any) =>
  new Promise((resolve, reject) => {
    for (const folder of platforms) {
      client
        .delete_file({ file: folder.concat("/", file) })
        .then(() => {
          resolve();
        })
        .catch((error: string) => {
          reject(error);
        });
    }
  });

export const compareStatus = (oldStatus: any, newStatus: any) => {
  if (oldStatus.currentVersion !== newStatus.currentVersion) return false;
  if (oldStatus.versions.revision !== newStatus.versions.revision) return false;
  if (oldStatus.versions.description !== newStatus.versions.description)
    return false;
  if (oldStatus.packages.length !== newStatus.packages.length) return false;
  if (oldStatus.availablePackages.length !== newStatus.availablePackages.length)
    return false;
  if (oldStatus.availableBinaries.length !== newStatus.availableBinaries.length)
    return false;
  return true;
};
