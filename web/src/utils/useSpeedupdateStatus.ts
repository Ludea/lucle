import { useState, useEffect, useContext } from "react";
import { Platforms, OptionsSchema, Versions } from "gen/speedupdate_pb";
import { create } from "@bufbuild/protobuf";
import { status } from "utils/speedupdaterpc";
import { SpeedupdateRPC } from "context/Speedupdate";

interface SpeedupdateStatus {
  currentRepo: Map<string, string[]>;
  setCurrentRepo: (repo: Map<string, string[]>) => void;
  platformsEnum: Platforms[];
  setPlatformsEnum: (platforms: Platforms[]) => void;
  listVersions: Versions[];
  listPackages: { name: string; published: boolean }[];
  availableBinaries: string[];
  currentVer: string;
  size: number | undefined;
  error: string | null;
  setError: (err: string | null) => void;
}

export function useSpeedupdateStatus(binaryType: "game" | "launcher"): SpeedupdateStatus {
  const speedupdateClient = useContext(SpeedupdateRPC);

  const [currentRepo, setCurrentRepo] = useState<Map<string, string[]>>(new Map());
  const [platformsEnum, setPlatformsEnum] = useState<Platforms[]>(
    JSON.parse(localStorage.getItem("platformsEnum") ?? "[]"),
  );
  const [listVersions, setListVersions] = useState<Versions[]>([]);
  const [listPackages, setListPackages] = useState<{ name: string; published: boolean }[]>([]);
  const [availableBinaries, setAvailableBinaries] = useState<string[]>([]);
  const [currentVer, setCurrentVer] = useState<string>("");
  const [size, setSize] = useState<number | undefined>(undefined);
  const [statusAlreadyStarted, setStatusAlreadyStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedCurrentRepo = localStorage.getItem("current_repo");
    if (savedCurrentRepo) {
      const parsed = JSON.parse(savedCurrentRepo);
      const map = new Map<string, string[]>();
      map.set(parsed.repo_name, parsed.platforms);
      if (currentRepo.size === 0) setCurrentRepo(map);
    }

    if (currentRepo.size === 0 || statusAlreadyStarted) return;

    const current = currentRepo.keys().next().value as string;

    const opt = create(OptionsSchema, { buildPath: ".", uploadPath: "." });
    status(speedupdateClient, current, platformsEnum, binaryType, opt).then((value) => {
      const reader = value.getReader();
      setStatusAlreadyStarted(true);

      async function readStream() {
        let result;
        while (!(result = await reader.read()).done) {
          setListVersions(result.value.versions);
          setListPackages(result.value.packages);
          setAvailableBinaries(result.value.binaries);
          setCurrentVer(result.value.currentVersion);
          setSize(result.value.size);
        }
      }
      readStream().catch((err: unknown) => setError(JSON.stringify(err)));
    });

    const eventSource = new EventSource(
      `https://repo.marlin-atlas.ts.net/${current}/${binaryType}/progression`,
    );
    eventSource.onmessage = (event) => {
      if (event.data === "100") eventSource.close();
    };
    eventSource.onerror = () => {
      setError("Lost connection to the update server");
      eventSource.close();
    };

    return () => eventSource.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRepo]);

  return {
    currentRepo,
    setCurrentRepo,
    platformsEnum,
    setPlatformsEnum,
    listVersions,
    listPackages,
    availableBinaries,
    currentVer,
    size,
    error,
    setError,
  };
}
