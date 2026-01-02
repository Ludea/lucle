import { useState, useEffect, useContext } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import IconButton from "@mui/material/IconButton";
import { DropzoneArea } from "mui2-file-dropzone";

// Icons
import WarningIcon from "@mui/icons-material/Warning";
import DeleteIcon from "@mui/icons-material/Delete";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

// RPC Connect
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { Repo, Platforms, Options, Versions } from "gen/speedupdate_pb";

//components
import PackagesTable from "views/Speedupdate/PackagesTable";
import BinariesTable from "views/Speedupdate/BinariesTable";
import VersionsTable from "views/Speedupdate/VersionsTable";
// apia
import { repoToDelete, status } from "utils/speedupdaterpc";
import { deleteRepo } from "utils/rpc";

// Context
import { useAuth } from "context/Auth";
import { LucleRPC } from "context/Luclerpc";

// import { uploadFile } from "utils/minio";

const transport = createGrpcWebTransport({
  baseUrl: "https://repo.marlin-atlas.ts.net",
});
const client = createClient(Repo, transport);

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
};

function Speedupdate() {
  const [key, setKey] = useState();
  const [statusAlreadyStarted, setStatusAlreadyStarted] = useState(false);
  const [uploadProgression, setUploadProgression] = useState<string>("");
  const [uploadBinariesHost, setUploadBinariesHost] = useState<number>(0);
  const [currentRepo, setCurrentRepo] = useState<Map<string, string[]>>(
    new Map(),
  );
  const [currentVer, setCurrentVer] = useState<string>("");
  const [size, setSize] = useState<number>();
  const [platformsEnum, setPlatformsEnum] = useState<Platforms[]>(
    JSON.parse(localStorage.getItem("platformsEnum")),
  );
  const [listVersions, setListVersions] = useState<any>();
  const [listRepo, setListRepo] = useState<Map<string, string[]>>(new Map());
  const [listPackages, setListPackages] = useState<string[]>([]);
  const [availableBinaries, setAvailableBinaries] = useState<string[]>([]);
  const [selectedVersionsValues, setSelectedVersionsValues] = useState<
    string[]
  >([]);
  const [buildPath, setBuildPath] = useState<string>("");
  const [uploadPath, setUploadPath] = useState<string>("");
  const [files, setFiles] = useState();
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  const lucleClient = useContext(LucleRPC);
  const controller = new AbortController();

  useEffect(() => {
    const savedCurrentRepo = localStorage.getItem("current_repo");
    if (savedCurrentRepo) {
      const parsedCurrentRepo = JSON.parse(savedCurrentRepo);
      const mapCurrentRepo = new Map();
      mapCurrentRepo.set(
        parsedCurrentRepo.repo_name,
        parsedCurrentRepo.platforms,
      );
      if (currentRepo.size === 0) setCurrentRepo(mapCurrentRepo);
    }

    const opt: Options = {
      buildPath: ".",
      uploadPath: ".",
    };

    if (currentRepo.size > 0) {
      const current = currentRepo.keys().next().value;
      if (!statusAlreadyStarted) {
        status(client, current, platformsEnum, "game", opt).then((value) => {
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
            setError(err);
          });
        });

        const eventSource = new EventSource(
          "https://repo.marlin-atlas.ts.net/" +
            current +
            "/game" +
            "/progression",
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
  }, [currentRepo, visibleVersions]);

  const uploadFile = () => {
    let platform;
    switch (uploadBinariesHost) {
      case 0:
        platform = "win64";
        break;
      case 1:
        platform = "macos_x64_86";
        break;
      case 2:
        platform = "macos_arm64";
        break;
      case 3:
        platform = "linux";
        break;
    }
    const current_repo = currentRepo.keys().next().value;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files[]", files[i]);
    }
    fetch(
      "https://repo.marlin-atlas.ts.net/" +
        current_repo +
        "/binaries" +
        "/" +
        platform,
      {
        method: "POST",
        body: formData,
      },
    )
      .then(() => {
        setFiles([]);
        setKey((prev) => prev + 1);
      })
      .catch((err: unknown) => {
        setFiles([]);
        setError(JSON.stringify(err));
      });
  };

  let speedupdatecomponent;

  if (currentRepo.size > 0) {
    speedupdatecomponent = (
      <Box sx={{ width: "100%" }}>
        <Paper sx={{ width: "100%", mb: 2 }}>
          <Grid container>
            <Grid size={12}>
              Current version: {currentVer ? currentVer : "-"}
            </Grid>
            <Grid size={12}>
              Total packages size: {size ? size + DisplaySizeUnit(size) : "-"}
            </Grid>
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
                setSelectedVersions([]);
                setSelectedVersionsValues([]);
                localStorage.removeItem("platformsEnum");
                localStorage.removeItem("current_repo");
              }}
            >
              <ExitToAppIcon />
            </IconButton>
            <IconButton
              size="large"
              onClick={() => {
                const path = currentRepo.keys().next().value;
                repoToDelete(client, path)
                  .then(() => {
                    deleteRepo(lucleClient, path)
                      .then(() => {
                        setError(null);
                        setCurrentRepo(new Map());
                        const list = listRepo;
                        list.delete(path);
                        setListRepo(list);
                        setPlatformsEnum([]);
                        localStorage.setItem(
                          "repositories",
                          JSON.stringify(Object.fromEntries(list)),
                        );
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
        <VersionsTable client={client} listVersions={listVersions} />
        <PackagesTable client={client} listPackages={listPackages} />
        <BinariesTable availableBinaries={availableBinaries} />
        Upload Binaries
        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="hosts">Hosts</InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            value={uploadBinariesHost}
            onChange={(event) => {
              setUploadBinariesHost(event.target.value);
            }}
            label="Hosts"
          >
            <MenuItem value={0}>Win64</MenuItem>
            <MenuItem value={1}>Macos x86_64</MenuItem>
            <MenuItem value={2}>Macos aarch64</MenuItem>
            <MenuItem value={3}>Linux</MenuItem>
          </Select>
        </FormControl>
        <DropzoneArea
          key={key}
          fileObjects={files}
          onChange={(newFile) => {
            setFiles(newFile);
          }}
        />
        <Grid
          container
          sx={{
            alignItems: "center",
          }}
        >
          <Grid size={9}>
            {uploadProgression ? (
              <LinearProgress variant="determinate" value={uploadProgression} />
            ) : null}
          </Grid>
          <Grid size={1}>
            {!uploadProgression ? (
              <Button color="primary" onClick={uploadFile}>
                Submit
              </Button>
            ) : null}
          </Grid>
        </Grid>
      </Box>
    );
  }
  return <div> {speedupdatecomponent} </div>;
}

export default Speedupdate;
