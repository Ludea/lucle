import { useState } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { DropzoneArea } from "mui2-file-dropzone";

import SpeedupdateTables from "components/Speedupdate/SpeedupdateTables";
import { useSpeedupdateStatus } from "utils/useSpeedupdateStatus";

function Game() {
  const { currentRepo, listVersions, listPackages, availableBinaries, setError } =
    useSpeedupdateStatus("game");

  const [key, setKey] = useState(0);
  const [uploadProgression, setUploadProgression] = useState("");
  const [uploadBinariesHost, setUploadBinariesHost] = useState(0);
  const [files, setFiles] = useState<File[]>([]);

  const uploadFile = () => {
    const platforms: Record<number, string> = {
      0: "win64",
      1: "macos_x64_86",
      2: "macos_arm64",
      3: "linux",
    };
    const current_repo = currentRepo.keys().next().value as string;
    const formData = new FormData();
    files.forEach((f) => formData.append("files[]", f));

    fetch(
      `https://repo.marlin-atlas.ts.net/${current_repo}/binaries/${platforms[uploadBinariesHost]}`,
      { method: "POST", body: formData },
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

  if (currentRepo.size === 0) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <SpeedupdateTables
        binaryType="game"
        currentRepo={currentRepo}
        listVersions={listVersions}
        listPackages={listPackages}
        availableBinaries={availableBinaries}
        onError={setError}
      />

      Upload Binaries
      <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
        <InputLabel id="hosts">Hosts</InputLabel>
        <Select
          labelId="hosts"
          value={uploadBinariesHost}
          onChange={(e) => setUploadBinariesHost(Number(e.target.value))}
          label="Hosts"
        >
          <MenuItem value={0}>Win64</MenuItem>
          <MenuItem value={1}>Macos x86_64</MenuItem>
          <MenuItem value={2}>Macos aarch64</MenuItem>
          <MenuItem value={3}>Linux</MenuItem>
        </Select>
      </FormControl>

      <DropzoneArea key={key} onChange={(newFiles) => setFiles(newFiles)} />

      <Grid container sx={{ alignItems: "center" }}>
        <Grid size={9}>
          {uploadProgression && (
            <LinearProgress variant="determinate" value={Number(uploadProgression)} />
          )}
        </Grid>
        <Grid size={1}>
          {!uploadProgression && (
            <Button color="primary" onClick={uploadFile}>Submit</Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Game;
