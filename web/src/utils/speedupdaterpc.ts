import { Platforms } from "gen/speedupdate_pb";
import { enumToKey, checkedToKeys, type PlatformKey, type RepoType } from "utils/platforms";

const setHeaders = (): Headers => {
  const token = localStorage.getItem("token");
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
};

export const init = (
  client: any,
  path: string,
  checked: Record<PlatformKey, boolean>,
) => {
  const headers = setHeaders();
  const keys = checkedToKeys(checked);
  return Promise.all(
    keys.flatMap((key) => [
      client.init({ path: path.concat("/game/", key) }, { headers }),
      client.init({ path: path.concat("/launcher/", key) }, { headers }),
    ]),
  );
};

export const isInit = (
  client: any,
  path: string,
  platforms: Platforms[],
  type: RepoType,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((platform) =>
      client.is_init({ path: path.concat("/", type, "/", enumToKey(platform)) }, { headers }),
    ),
  );
};

export const setCurrentVersion = (
  client: any,
  path: string,
  version: string,
  platforms: Platforms[],
  type: RepoType,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((platform) =>
      client.set_current_version(
        { path: path.concat("/", type, "/", enumToKey(platform)), version },
        { headers },
      ),
    ),
  );
};

export const registerVersion = (
  client: any,
  path: string,
  version: string,
  description: string,
  platforms: Platforms[],
  type: RepoType,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((platform) =>
      client.register_version(
        { path: path.concat("/", type, "/", enumToKey(platform)), version, description },
        { headers },
      ),
    ),
  );
};

export const unregisterVersion = (
  client: any,
  path: string,
  version: string,
  platforms: Platforms[],
  type: RepoType,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((platform) =>
      client.unregister_version(
        { path: path.concat("/", type, "/", enumToKey(platform)), version },
        { headers },
      ),
    ),
  );
};

export const registerPackage = (
  client: any,
  path: string,
  name: string,
  platforms: Platforms[],
  type: RepoType,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((platform) =>
      client.register_package(
        { path: path.concat("/", type, "/", enumToKey(platform)), name },
        { headers },
      ),
    ),
  );
};

export const unregisterPackage = (
  client: any,
  path: string,
  name: string,
  platforms: Platforms[],
  type: RepoType,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((platform) =>
      client.unregister_package(
        { path: path.concat("/", type, "/", enumToKey(platform)), name },
        { headers },
      ),
    ),
  );
};

export const repoToDelete = (client: any, path: string) => {
  const headers = setHeaders();
  return client.delete_repo({ path }, { headers });
};

export const fileToDelete = (
  client: any,
  file: string,
  platforms: Platforms[],
  type: RepoType,
) => {
  const headers = setHeaders();
  return Promise.all(
    platforms.map((platform) =>
      client.delete_file(
        { file: enumToKey(platform).concat("/", type, "/", file) },
        { headers },
      ),
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

export function status(
  client: any,
  path: string,
  platforms: Platforms[],
  type: RepoType,
  opt: any,
) {
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
