const setHeaders = (): Headers => {
  const token = localStorage.getItem("token");
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
};

export const init = async (client: any, path: string, platforms: any) =>
  new Promise((resolve, reject) => {
    let headers = setHeaders();
    const subPath = Object.keys(platforms).filter(
      (key) => platforms[key] === true,
    );
    for (const folder of subPath) {
      client
        .init(
          {
            path: path.concat("/game/", folder),
          },
          { headers },
        )
        .then(() => {
          resolve();
        })
        .catch((error: any) => {
          reject(error);
        });
      client
        .init(
          {
            path: path.concat("/launcher/", folder),
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

export const isInit = async (
  client: any,
  path: string,
  platforms: any,
  type: string,
) =>
  new Promise((resolve, reject) => {
    let headers = setHeaders();
    for (const folder of platforms) {
      client
        .is_init(
          {
            path: path.concat("/", type, "/", folder),
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
  type: string,
) =>
  new Promise((resolve, reject) => {
    let headers = setHeaders();
    for (const folder of platforms) {
      client
        .set_current_version(
          {
            path: path.concat("/", type, "/", folder),
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
  type: string,
) =>
  new Promise((resolve, reject) => {
    let headers = setHeaders();
    for (const folder of platforms) {
      client
        .register_version(
          {
            path: path.concat("/", type, "/", folder),
            version,
            description,
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

export const unregisterVersion = async (
  client: any,
  path: string,
  version: string,
  platforms: any,
  type: string,
) =>
  new Promise((resolve, reject) => {
    let headers = setHeaders();
    for (const folder of platforms) {
      client
        .unregister_version(
          {
            path: path.concat("/", type, "/", folder),
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
  type: string,
) =>
  new Promise((resolve, reject) => {
    let headers = setHeaders();
    for (const folder of platforms) {
      client
        .register_package(
          {
            path: path.concat("/", type, "/", folder),
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
  type: string,
) =>
  new Promise((resolve, reject) => {
    let headers = setHeaders();
    for (const folder of platforms) {
      client
        .unregister_package(
          {
            path: path.concat("/", type, "/", folder),
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
    let headers = setHeaders();
    client
      .delete_repo({ path: path })
      .then(
        () => {
          resolve();
        },
        { headers },
      )
      .catch((error: string) => {
        reject(error);
      });
  });
};

export const fileToDelete = async (
  client: any,
  file: string,
  platforms: any,
  type: string,
) =>
  new Promise((resolve, reject) => {
    let headers = setHeaders();
    for (const folder of platforms) {
      client
        .delete_file({ file: folder.concat("/", type, "/", file) })
        .then(
          () => {
            resolve();
          },
          { headers },
        )
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

export async function status(
  client: any,
  path: string,
  platforms: any,
  type: string,
  opt: any,
) {
  return new ReadableStream({
    async start(controller) {
      let headers = setHeaders();
      const call = client.status(
        {
          path: path.concat("/", type),
          platforms: platforms,
          options: opt,
        },
        { headers },
      );
      for await (const repo of call) {
        const compare_repo = repo.status.every((state: any) =>
          compareStatus(repo.status[0], state),
        );
        if (compare_repo) {
          const firstRepo = repo.status[0];
          const fullListPackages = [];
          firstRepo.packages.map((row: any) => {
            fullListPackages.push({ name: row, published: true });
          });
          firstRepo.availablePackages.map((row: any) => {
            fullListPackages.push({ name: row, published: false });
          });

          let repo_state = {
            versions: firstRepo.versions,
            packages: fullListPackages,
            binaries: firstRepo.availableBinaries,
            size: firstRepo.size,
            currentVersion: firstRepo.currentVersion,
          };

          controller.enqueue(repo_state);
        } else {
          console.log("Repository are not sync between platforms");
        }
      }
    },
  });
}
