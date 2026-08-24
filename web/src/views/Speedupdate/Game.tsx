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

function Game() {
  const [key, setKey] = useState(0);
  const [uploadProgression, setUploadProgression] = useState<number | null>(null);
  const [uploadBinariesHost, setUploadBinariesHost] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [currentRepo] = useState<Map<string, string[]>>(
    (() => {
      const saved = localStorage.getItem("current_repo");
      if (!saved) return new Map();
      const parsed = JSON.parse(saved);
      const map = new Map<string, string[]>();
      map.set(parsed.repo_name, parsed.platforms);
      return map;
    })(),
  );

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

    const eventSource = new EventSource(
      `https://repo.marlin-atlas.ts.net/${current_repo}/game/progression`,
    );
    eventSource.onmessage = (event) => {
      const progress = Number(event.data);
      setUploadProgression(progress);
      if (progress >= 100) {
        eventSource.close();
        setUploadProgression(null);
        setFiles([]);
        setKey((prev) => prev + 1);
      }
    };
    eventSource.onerror = () => eventSource.close();

    fetch(
      `https://repo.marlin-atlas.ts.net/${current_repo}/binaries/${platforms[uploadBinariesHost]}`,
      { method: "POST", body: formData },
    )
      .then(() => setFiles([]))
      .catch(() => {
        setFiles([]);
        eventSource.close();
        setUploadProgression(null);
      });
  };

  if (currentRepo.size === 0) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <SpeedupdateTables binaryType="game" onError={() => {}} />

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
          {uploadProgression !== null && (
            <LinearProgress variant="determinate" value={uploadProgression} />
          )}
        </Grid>
        <Grid size={1}>
          {uploadProgression === null && (
            <Button color="primary" onClick={uploadFile}>Submit</Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Game;
