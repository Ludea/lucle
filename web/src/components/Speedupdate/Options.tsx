import { useState, useEffect, useContext } from "react";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";

// Icons
import WarningIcon from "@mui/icons-material/Warning";
import DeleteIcon from "@mui/icons-material/Delete";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

//Context
import { SpeedupdateRPC } from "context/Speedupdate";
import { LucleRPC } from "context/Luclerpc";

// api
import { repoToDelete, status } from "utils/speedupdaterpc";
import { deleteRepo } from "utils/rpc";
import { OptionsSchema, Platforms } from "gen/speedupdate_pb";
import { create } from "@bufbuild/protobuf";

import { useNavigate } from "react-router";

// Kept local rather than shared with Game.tsx (which defines the same helper
// but never calls it) to avoid introducing new cross-file coupling here.
const DisplaySizeUnit = (TotalSize: number) => {
  if (TotalSize > 0 && TotalSize < 1024) {
    return "B";
  }
  if (TotalSize < 1024 * 1024) {
    return "kB";
  }
  if (TotalSize < 1024 * 1024 * 1024) {
    return "MB";
  }
  if (TotalSize < 1024 * 1024 * 1024 * 1024) {
    return "GB";
  }
  return "TB";
};

function SpeedupdateOptions({ binaryType }: { binaryType: string }) {
  const [statusAlreadyStarted, setStatusAlreadyStarted] = useState(false);
  const [currentVer, setCurrentVer] = useState<string>("");
  const [size, setSize] = useState<number>();
  const [platformsEnum, setPlatformsEnum] = useState<Platforms[]>(
    JSON.parse(localStorage.getItem("platformsEnum") ?? "[]"),
  );
  const [buildPath, setBuildPath] = useState<string>("");
  const [uploadPath, setUploadPath] = useState<string>("");
  const [currentRepo, setCurrentRepo] = useState<Map<string, string[]>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const speedupdateClient = useContext(SpeedupdateRPC);
  const lucleClient = useContext(LucleRPC);
  const controller = new AbortController();

  useEffect(() => {
    const savedCurrentRepo = localStorage.getItem("current_repo");
    if (savedCurrentRepo) {
      const parsedCurrentRepo = JSON.parse(savedCurrentRepo);
      const mapCurrentRepo = new Map();
      mapCurrentRepo.set(parsedCurrentRepo.repo_name, parsedCurrentRepo.platforms);
      if (currentRepo.size === 0) setCurrentRepo(mapCurrentRepo);
    }

    const opt = create(OptionsSchema, {
      buildPath: ".",
      uploadPath: ".",
    });

    if (currentRepo.size > 0) {
      const current = currentRepo.keys().next().value as string;
      if (!statusAlreadyStarted) {
        status(speedupdateClient, current, platformsEnum, binaryType, opt).then((value) => {
          const reader = value.getReader();
          setStatusAlreadyStarted(true);
          async function readStream() {
            let result;
            while (!(result = await reader.read()).done) {
              setSize(result.value.size);
              setCurrentVer(result.value.currentVersion);
            }
          }
          readStream().catch((err: unknown) => {
            setError(JSON.stringify(err));
          });
        });
      }
    }
  }, [currentRepo]);

  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      <Grid container>
        <Grid size={12}>Current version: {currentVer ? currentVer : "-"}</Grid>
        <Grid size={12}>Total packages size: {size ? size + DisplaySizeUnit(size) : "-"}</Grid>
        Options:
        <Grid size={12}>
          Build path:{" "}
          <TextField
            value={buildPath}
            id="build-path"
            label=""
            variant="standard"
            onChange={(event) => {
              setBuildPath(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          Upload path:{" "}
          <TextField
            value={uploadPath}
            id="upload-path"
            label=""
            variant="standard"
            onChange={(event) => {
              setUploadPath(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          {error !== null ? (
            <div>
              <WarningIcon />
              {error}
            </div>
          ) : null}
        </Grid>
        <IconButton
          size="large"
          onClick={() => {
            controller.abort();
            setError(null);
            setCurrentRepo(new Map());
            setPlatformsEnum([]);
            localStorage.removeItem("platformsEnum");
            localStorage.removeItem("current_repo");
            navigate("/dashboard");
          }}
        >
          <ExitToAppIcon />
        </IconButton>
        <IconButton
          size="large"
          onClick={() => {
            const path = currentRepo.keys().next().value as string;
            repoToDelete(speedupdateClient, path)
              .then(() => {
                deleteRepo(lucleClient, path)
                  .then(() => {
                    setError(null);
                    setCurrentRepo(new Map());
                    const savedRepositories = localStorage.getItem("repositories");
                    const list = savedRepositories ? JSON.parse(savedRepositories) : {};
                    delete list[path];
                    localStorage.setItem("repositories", JSON.stringify(list));
                    setPlatformsEnum([]);
                    localStorage.removeItem("platformsEnum");
                    localStorage.removeItem("current_repo");
                  })
                  .catch((err: unknown) => {
                    setError((err as { rawMessage: string }).rawMessage);
                  });
              })
              .catch((err: unknown) => {
                setError((err as { rawMessage: string }).rawMessage);
              });
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Grid>
    </Paper>
  );
}

export default SpeedupdateOptions;
