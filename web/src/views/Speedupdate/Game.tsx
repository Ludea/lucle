import { useState, useEffect, useContext } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { DropzoneArea } from "mui2-file-dropzone";

// RPC Connect
import { Platforms, OptionsSchema, Versions } from "gen/speedupdate_pb";
import { create } from "@bufbuild/protobuf";

//components
import PackagesTable from "views/Speedupdate/PackagesTable";
import BinariesTable from "views/Speedupdate/BinariesTable";
import VersionsTable from "views/Speedupdate/VersionsTable";
import SpeedupdateOptions from "components/Speedupdate/Options";

// api
import { status } from "utils/speedupdaterpc";

// Context
import { SpeedupdateRPC } from "context/Speedupdate";

// import { uploadFile } from "utils/minio";

function Game() {
  const [key, setKey] = useState(0);
  const [statusAlreadyStarted, setStatusAlreadyStarted] = useState(false);
  const [uploadProgression, setUploadProgression] = useState<string>("");
  const [uploadBinariesHost, setUploadBinariesHost] = useState<number>(0);
  const [currentRepo, setCurrentRepo] = useState<Map<string, string[]>>(new Map());
  const [platformsEnum, setPlatformsEnum] = useState<Platforms[]>(
    JSON.parse(localStorage.getItem("platformsEnum") ?? "[]"),
  );
  const [listVersions, setListVersions] = useState<Versions[]>([]);
  const [listPackages, setListPackages] = useState<{ name: string; published: boolean }[]>([]);
  const [availableBinaries, setAvailableBinaries] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const speedupdateClient = useContext(SpeedupdateRPC);

  useEffect(() => {
    const savedCurrentRepo = localStorage.getItem("current_repo");
    if (savedCurrentRepo) {
      const parsedCurrentRepo = JSON.parse(savedCurrentRepo);
      const mapCurrentRepo = new Map();
      mapCurrentRepo.set(parsedCurrentRepo.repo_name, parsedCurrentRepo.platforms);
      if (currentRepo.size === 0) setCurrentRepo(mapCurrentRepo);
    }

    if (currentRepo.size > 0) {
      const current = currentRepo.keys().next().value as string;
      if (!statusAlreadyStarted) {
        const opt = create(OptionsSchema, {
          buildPath: ".",
          uploadPath: ".",
        });
        status(speedupdateClient, current, platformsEnum, "game", opt).then((value) => {
          const reader = value.getReader();
          setStatusAlreadyStarted(true);
          async function readStream() {
            let result;
            while (!(result = await reader.read()).done) {
              setListVersions(result.value.versions);
              setListPackages(result.value.packages);
              setAvailableBinaries(result.value.binaries);
            }
          }
          readStream().catch((err: unknown) => {
            setError(JSON.stringify(err));
          });
        });

        const eventSource = new EventSource(
          "https://repo.marlin-atlas.ts.net/" + current + "/game" + "/progression",
        );
        eventSource.onmessage = (event) => {
          setUploadProgression(event.data);
          if (event.data === "100") {
            setUploadProgression("");
            setFiles([]);
          }
        };
        eventSource.onerror = () => {
          setError("Lost connection to the update server");
        };
      }
    }
  }, [currentRepo]);

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
    const current_repo = currentRepo.keys().next().value as string;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files[]", files[i]);
    }
    fetch("https://repo.marlin-atlas.ts.net/" + current_repo + "/binaries" + "/" + platform, {
      method: "POST",
      body: formData,
    })
      .then(() => {
        setFiles([]);
        setKey((prev) => prev + 1);
      })
      .catch((err: unknown) => {
        setFiles([]);
        setError(JSON.stringify(err));
      });
  };

  return (
    <>
      {currentRepo.size > 0 ? (
        <Box sx={{ width: "100%" }}>
          <SpeedupdateOptions binaryType={"game"} />
          <VersionsTable
            client={speedupdateClient}
            currentRepo={currentRepo}
            listVersions={listVersions}
            onError={setError}
          />
          <PackagesTable
            client={speedupdateClient}
            currentRepo={currentRepo}
            listPackages={listPackages}
            onError={setError}
          />
          <BinariesTable
            client={speedupdateClient}
            currentRepo={currentRepo}
            availableBinaries={availableBinaries}
            onError={setError}
          />
          Upload Binaries
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="hosts">Hosts</InputLabel>
            <Select
              labelId="demo-simple-select-standard-label"
              id="demo-simple-select-standard"
              value={uploadBinariesHost}
              onChange={(event) => {
                setUploadBinariesHost(Number(event.target.value));
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
                <LinearProgress variant="determinate" value={Number(uploadProgression)} />
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
      ) : null}
    </>
  );
}

export default Game;
