const setHeaders = (): Headers => {
  const token = localStorage.getItem("token");
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
};

export const init = async (client: any, path: string, platforms: any) => {
  const headers = setHeaders();
  const subPath = Object.keys(platforms).filter((key) => platforms[key] === true);
  for (const folder of subPath) {
    client.init({ path: path.concat("/game/", folder) }, { headers });
    client.init({ path: path.concat("/launcher/", folder) }, { headers });
  }
};

export const isInit = async (client: any, path: string, platforms: any, type: string) => {
  const headers = setHeaders();
  for (const folder of platforms) {
    client.isInit({ path: path.concat("/", type, "/", folder) }, { headers });
  }
};

export const setCurrentVersion = async (
  client: any,
  path: string,
  version: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  for (const folder of platforms) {
    client.setCurrentVersion({ path: path.concat("/", type, "/", folder), version }, { headers });
  }
};

export const registerVersion = async (
  client: any,
  path: string,
  version: string,
  description: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  for (const folder of platforms) {
    client.registerVersion(
      { path: path.concat("/", type, "/", folder), version, description },
      { headers },
    );
  }
};

export const unregisterVersion = async (
  client: any,
  path: string,
  version: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  for (const folder of platforms) {
    client.unregisterVersion({ path: path.concat("/", type, "/", folder), version }, { headers });
  }
};

export const registerPackage = async (
  client: any,
  path: string,
  name: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  for (const folder of platforms) {
    client.registerPackage({ path: path.concat("/", type, "/", folder), name }, { headers });
  }
};

export const unregisterPackage = async (
  client: any,
  path: string,
  name: string,
  platforms: any,
  type: string,
) => {
  const headers = setHeaders();
  for (const folder of platforms) {
    client.unregisterPackage({ path: path.concat("/", type, "/", folder), name }, { headers });
  }
};

export const repoToDelete = async (client: any, path: string) => {
  const headers = setHeaders();
  client.deleteRepo({ path }, { headers });
};

export const fileToDelete = async (client: any, file: string, platforms: any, type: string) => {
  const headers = setHeaders();
  for (const folder of platforms) {
    client.deleteFile({ file: folder.concat("/", type, "/", file) }, { headers });
  }
};

export const compareStatus = (oldStatus: any, newStatus: any) => {
  if (oldStatus.currentVersion !== newStatus.currentVersion) return false;
  if (oldStatus.packages.length !== newStatus.packages.length) return false;
  if (oldStatus.availablePackages.length !== newStatus.availablePackages.length) return false;
  if (oldStatus.availableBinaries.length !== newStatus.availableBinaries.length) return false;
  return true;
};

export async function status(client: any, path: string, platforms: any, type: string, opt: any) {
  return new ReadableStream({
    async start(controller) {
      const headers = setHeaders();
      const call = client.status(
        {
          path: path.concat("/", type),
          platforms,
          options: opt,
        },
        { headers },
      );
      for await (const repo of call) {
        const statuses = repo.status;
        if (!statuses?.length) continue;

        const compare_repo = statuses.every((state: any) => compareStatus(statuses[0], state));
        if (compare_repo) {
          const firstRepo = statuses[0];
          const fullListPackages: { name: string; published: boolean }[] = [
            ...firstRepo.packages.map((name: string) => ({ name, published: true })),
            ...firstRepo.availablePackages.map((name: string) => ({ name, published: false })),
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
      controller.close();
    },
  });
}
