import { useState, useEffect, useRef, useContext } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
import { Platforms, OptionsSchema, Versions } from "gen/speedupdate_pb";
import { create } from "@bufbuild/protobuf";
import { status } from "utils/speedupdaterpc";
import { SpeedupdateRPC } from "context/Speedupdate";
import { type PlatformKey, type RepoType } from "utils/platforms";

interface SpeedupdateStatus {
  currentRepo: Map<string, PlatformKey[]>;
  setCurrentRepo: (repo: Map<string, PlatformKey[]>) => void;
  platformsEnum: Platforms[];
  setPlatformsEnum: (platforms: Platforms[]) => void;
  listVersions: Versions[];
  listPackages: { name: string; published: boolean }[];
  availableBinaries: string[];
  currentVer: string;
  size: number | undefined;
  buildPath: string;
  setBuildPath: (path: string) => void;
  uploadPath: string;
  setUploadPath: (path: string) => void;
  error: string | null;
  setError: (err: string | null) => void;
}

const SSE_MAX_RETRIES = 3;

export function useSpeedupdateStatus(
  binaryType: RepoType,
  initialPlatforms: Platforms[] = [],
): SpeedupdateStatus {
  const speedupdateClient = useContext(SpeedupdateRPC);

  const [currentRepo, setCurrentRepo] = useState<Map<string, PlatformKey[]>>(() => {
    const saved = localStorage.getItem("current_repo");
    if (!saved) return new Map();
    const parsed = JSON.parse(saved);
    const map = new Map<string, PlatformKey[]>();
    map.set(parsed.repo_name, parsed.platforms as PlatformKey[]);
    return map;
  });
  const [platformsEnum, setPlatformsEnum] = useState<Platforms[]>(initialPlatforms);
  const [listVersions, setListVersions] = useState<Versions[]>([]);
  const [listPackages, setListPackages] = useState<{ name: string; published: boolean }[]>([]);
  const [availableBinaries, setAvailableBinaries] = useState<string[]>([]);
  const [currentVer, setCurrentVer] = useState<string>("");
  const [size, setSize] = useState<number | undefined>(undefined);
  const [buildPath, setBuildPath] = useState<string>("");
  const [uploadPath, setUploadPath] = useState<string>("");
  const debouncedBuildPath = useDebounce(buildPath, 500);
  const debouncedUploadPath = useDebounce(uploadPath, 500);
  const [statusAlreadyStarted, setStatusAlreadyStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const stoppedRef = useRef(false);
  const sseRetriesRef = useRef(0);

  useEffect(() => {
    stoppedRef.current = false;

    if (currentRepo.size === 0 || statusAlreadyStarted) return;

    const current = currentRepo.keys().next().value as string;

    const opt = create(OptionsSchema, {
  buildPath: debouncedBuildPath || ".build",
  uploadPath: debouncedUploadPath || "binaries",
});
    
    status(speedupdateClient, current, platformsEnum, binaryType, opt).then((value) => {
      if (stoppedRef.current) {
        value.cancel();
        return;
      }
      const reader = value.getReader();
      readerRef.current = reader;
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
      readStream().catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(JSON.stringify(err));
      });
    });

    function openSSE(repoName: string) {
      if (stoppedRef.current) return;

      const es = new EventSource(
        `https://repo.marlin-atlas.ts.net/${repoName}/${binaryType}/progression`,
      );
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        sseRetriesRef.current = 0;
        if (event.data === "100") es.close();
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        if (stoppedRef.current) return;
        if (sseRetriesRef.current < SSE_MAX_RETRIES) {
          sseRetriesRef.current += 1;
          const delay = 2000 * sseRetriesRef.current;
          setTimeout(() => openSSE(repoName), delay);
        }
        // silently give up after max retries — progression is non-critical
      };
    }

    sseRetriesRef.current = 0;
    openSSE(current);

    return () => {
      stoppedRef.current = true;
      setStatusAlreadyStarted(false);
      readerRef.current?.cancel().catch(() => {});
      readerRef.current = null;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [currentRepo, debouncedBuildPath, debouncedUploadPath]);

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
    buildPath,
    setBuildPath,
    uploadPath,
    setUploadPath,
    error,
    setError,
  };
}
