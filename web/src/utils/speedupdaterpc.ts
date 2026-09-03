const setHeaders = (): Headers => {
  const token = localStorage.getItem("token");
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
};

export const init = (client: any, path: string, platforms: any) => {
  const headers = setHeaders();
  const subPath = Object.keys(platforms).filter((key) => platforms[key] === true);
  return Promise.all(
    subPath.flatMap((folder) => [
      client.init({ path: path.concat("/game/", folder) }, { headers }),
      client.init({ path: path.concat("/launcher/", folder) }, { headers }),
    ]),
  );
};

export const isInit = (client: any, path: string, platforms: any, type: string) => {
  const headers = setHeaders();
  console.log("12: ", client);
  return Promise.all(
    platforms.map((folder: string) =>
      client.is_init({ path: path.concat("/", type, "/", folder) }, { headers }),
    ),
  );
};

export const setCurrentVersion = (
  client: any,
  path: string,
  version: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((folder: string) =>
      client.set_current_version({ path: path.concat("/", type, "/", folder), version }, { headers }),
    ),
  );
};

export const registerVersion = (
  client: any,
  path: string,
  version: string,
  description: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((folder: string) =>
      client.register_version(
        { path: path.concat("/", type, "/", folder), version, description },
        { headers },
      ),
    ),
  );
};

export const unregisterVersion = (
  client: any,
  path: string,
  version: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((folder: string) =>
      client.unregister_version({ path: path.concat("/", type, "/", folder), version }, { headers }),
    ),
  );
};

export const registerPackage = (
  client: any,
  path: string,
  name: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((folder: string) =>
      client.register_package({ path: path.concat("/", type, "/", folder), name }, { headers }),
    ),
  );
};

export const unregisterPackage = (
  client: any,
  path: string,
  name: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((folder: string) =>
      client.unregister_package({ path: path.concat("/", type, "/", folder), name }, { headers }),
    ),
  );
};

export const repoToDelete = (client: any, path: string) => {
  const headers = setHeaders();
  return client.delete_repo({ path }, { headers });
};

export const fileToDelete = (client: any, file: string, platforms: any, type: string) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((folder: string) =>
      client.delete_file({ file: folder.concat("/", type, "/", file) }, { headers }),
    ),
  );
};

export const compareStatus = (oldStatus: any, newStatus: any) => {
  if (oldStatus.currentVersion !== newStatus.currentVersion) return false;
  if (oldStatus.packages.length !== newStatus.packages.length) return false;
  if (oldStatus.availablePackages.length !== newStatus.availablePackages.length) return false;
  if (oldStatus.availableBinaries.length !== newStatus.availableBinaries.length) return false;
  return true;
};

export function status(client: any, path: string, platforms: any, type: string, opt: any) {
  return Promise.resolve(
    new ReadableStream({
      start(controller) {
        const headers = setHeaders();
        const call = client.status(
          {
            path: path.concat("/", type),
            platforms,
            options: opt,
          },
          { headers },
        );
        console.log("call →", call, Object.keys(call));
        const iterator = call[Symbol.asyncIterator]();

        const readNext = (): Promise<void> =>
          iterator
            .next()
            .then((result: any) => {
              if (result.done) {
                controller.close();
                return;
              }

              const statuses = result.value.status;
              if (statuses?.length) {
                const compare_repo = statuses.every((state: any) =>
                  compareStatus(statuses[0], state),
                );
                if (compare_repo) {
                  const firstRepo = statuses[0];
                  const fullListPackages: { name: string; published: boolean }[] = [
                    ...firstRepo.packages.map((name: string) => ({ name, published: true })),
                    ...firstRepo.availablePackages.map((name: string) => ({
                      name,
                      published: false,
                    })),
                  ];

                  controller.enqueue({
                    versions: firstRepo.versions,
                    packages: fullListPackages,
                    binaries: firstRepo.availableBinaries,
                    size: firstRepo.size,
                    currentVersion: firstRepo.currentVersion,
                  });
                } else {
                  console.log("Repository are not sync between platforms");
                }
              }

              return readNext();
            })
            .catch((error: unknown) => controller.error(error));

        return readNext();
      },
    }),
  );
}
