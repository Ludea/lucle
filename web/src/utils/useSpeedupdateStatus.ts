import { useState, useEffect, useRef, useContext } from "react";
import { Platforms, OptionsSchema, Versions } from "gen/speedupdate_pb";
import { create } from "@bufbuild/protobuf";
import { status } from "utils/speedupdaterpc";
import { SpeedupdateRPC } from "context/Speedupdate";

interface SpeedupdateStatus {
  currentRepo:       Map<string, string[]>;
  setCurrentRepo:    (repo: Map<string, string[]>) => void;
  platformsEnum:     Platforms[];
  setPlatformsEnum:  (platforms: Platforms[]) => void;
  listVersions:      Versions[];
  listPackages:      { name: string; published: boolean }[];
  availableBinaries: string[];
  currentVer:        string;
  size:              number | undefined;
  error:             string | null;
  setError:          (err: string | null) => void;
}

export function useSpeedupdateStatus(
  binaryType: "game" | "launcher",
  initialPlatforms: Platforms[] = [],
): SpeedupdateStatus {
  const speedupdateClient = useContext(SpeedupdateRPC);

  const [currentRepo, setCurrentRepo] = useState<Map<string, string[]>>(() => {
    const saved = localStorage.getItem("current_repo");
    if (!saved) return new Map();
    const parsed = JSON.parse(saved);
    const map = new Map<string, string[]>();
    map.set(parsed.repo_name, parsed.platforms);
    return map;
  });
  const [platformsEnum, setPlatformsEnum] = useState<Platforms[]>(initialPlatforms);
  const [listVersions, setListVersions] = useState<Versions[]>([]);
  const [listPackages, setListPackages] = useState<{ name: string; published: boolean }[]>([]);
  const [availableBinaries, setAvailableBinaries] = useState<string[]>([]);
  const [currentVer, setCurrentVer] = useState<string>("");
  const [size, setSize] = useState<number | undefined>(undefined);
  const [statusAlreadyStarted, setStatusAlreadyStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs so the cleanup function can cancel both the gRPC stream and the SSE
  // connection without needing them in the dependency array.
  const readerRef      = useRef<ReadableStreamDefaultReader | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const stoppedRef     = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    if (currentRepo.size === 0 || statusAlreadyStarted) return;

    const current = currentRepo.keys().next().value as string;

    const opt = create(OptionsSchema, { buildPath: ".", uploadPath: "." });
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

    const eventSource = new EventSource(
      `https://repo.marlin-atlas.ts.net/${current}/${binaryType}/progression`,
    );
    eventSourceRef.current = eventSource;
    eventSource.onmessage = (event) => {
      if (event.data === "100") eventSource.close();
    };
    eventSource.onerror = () => {
      setError("Lost connection to the update server");
      eventSource.close();
    };

    return () => {
      stoppedRef.current = true;
      // Reset so the stream restarts on remount or page refresh
      setStatusAlreadyStarted(false);
      readerRef.current?.cancel().catch(() => {});
      readerRef.current = null;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
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
