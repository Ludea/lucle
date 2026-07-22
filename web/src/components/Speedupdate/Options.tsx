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

// api
import { repoToDelete, status } from "utils/speedupdaterpc";
import { deleteRepo } from "utils/rpc";

import { useNavigate } from "react-router-dom";

function Options({ binaryType }: { binaryType: string }) {
  const [statusAlreadyStarted, setStatusAlreadyStarted] = useState(false);
  const [currentVer, setCurrentVer] = useState<string>("");
  const [size, setSize] = useState<number>();
  const [platformsEnum, setPlatformsEnum] = useState<Platforms[]>(
    JSON.parse(localStorage.getItem("platformsEnum")),
  );
  const [buildPath, setBuildPath] = useState<string>("");
  const [uploadPath, setUploadPath] = useState<string>("");
  const [currentRepo, setCurrentRepo] = useState<Map<string, string[]>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const speedupdateClient = useContext(SpeedupdateRPC);
  const controller = new AbortController();

  useEffect(() => {
    const savedCurrentRepo = localStorage.getItem("current_repo");
    if (savedCurrentRepo) {
      const parsedCurrentRepo = JSON.parse(savedCurrentRepo);
      const mapCurrentRepo = new Map();
      mapCurrentRepo.set(parsedCurrentRepo.repo_name, parsedCurrentRepo.platforms);
      if (currentRepo.size === 0) setCurrentRepo(mapCurrentRepo);
    }

    const opt: Options = {
      buildPath: ".",
      uploadPath: ".",
    };

    if (currentRepo.size > 0) {
      const current = currentRepo.keys().next().value;
      if (!statusAlreadyStarted) {
        status(speedupdateClient, current, platformsEnum, binaryType, opt).then((value) => {
          const reader = value.getReader();
          setStatusAlreadyStarted(true);
          async function readStream() {
            let result;
            while (!(result = await reader.read()).done) {
              setListVersions(result.value.versions);
              setListPackages(result.value.packages);
              setAvailableBinaries(result.value.binaries);
              setSize(result.value.size);
              setCurrentVer(result.value.currentVersion);
            }
          }
          readStream().catch((err: unknown) => {
            setError(JSON.stringify(err));
          });
        });

        const eventSource = new EventSource(
          "https://repo.marlin-atlas.ts.net/" + current + "/" + binaryType + "/progression",
        );
        eventSource.onmessage = (event) => {
          setUploadProgression(event.data);
          if (event.data === "100") {
            setUploadProgression(null);
            setFiles(null);
          }
        };
        eventSource.onerror = (error) => {
          setError(error);
        };
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
            value={buildPath}
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
            const path = currentRepo.keys().next().value;
            repoToDelete(SpeedupdateClient, path)
              .then(() => {
                deleteRepo(lucleClient, path)
                  .then(() => {
                    setError(null);
                    setCurrentRepo(new Map());
                    const list = listRepo;
                    list.delete(path);
                    setListRepo(list);
                    setPlatformsEnum([]);
                    localStorage.setItem("repositories", JSON.stringify(Object.fromEntries(list)));
                    localStorage.removeItem("platformsEnum");
                    localStorage.removeItem("current_repo");
                  })
                  .catch((err: unknown) => {
                    setError(err.rawMessage);
                  });
              })
              .catch((err: unknown) => {
                setError(err.rawMessage);
              });
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Grid>
    </Paper>
  );
}

export default Options;
