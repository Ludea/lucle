import { useState, useContext } from "react";

import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import { build_custom_launcher } from "utils/sparusrpc";
import { SparusRPC } from "context/Sparus";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

function Launcher() {
  const [gameName, setGameName] = useState<string>("");
  const [launcherName, setLauncherName] = useState<string>("");
  const [configName, setConfigName] = useState<string>("Sparus.json");
  const [repositoryName, setRepositoryName] = useState<string>("");
  const [updateURL, setUpdateURL] = useState<string>(
    "https://repo.marlin-atlas.ts.net",
  );
  const [pluginsURL, setPluginsURL] = useState<string>("");
  const [disableLauncherCreation, setDisableLauncherCreation] =
    useState<boolean>(false);
  const SparusClient = useContext(SparusRPC);

  return (
    <div>
      <Grid container>
        <Grid size={12}>
          <TextField
            margin="normal"
            required
            id="launcher"
            label="Launcher name"
            name="launcher"
            autoComplete="launcher"
            sx={{
              width: "30%",
            }}
            value={launcherName}
            onChange={(event) => {
              setLauncherName(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            margin="normal"
            required
            id="repository"
            label="Repository name"
            name="repository"
            autoComplete="repository"
            sx={{
              width: "30%",
            }}
            value={repositoryName}
            onChange={(event) => {
              setRepositoryName(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            margin="normal"
            required
            id="update_server"
            label="Url of the update server"
            name="update_server"
            autoComplete="update_server"
            sx={{
              width: "30%",
            }}
            value={updateURL}
            onChange={(event) => {
              setUpdateURL(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            margin="normal"
            required
            id="plugin_url"
            label="Url of the plugins"
            name="plugin_url"
            autoComplete="plugin_url"
            sx={{
              width: "30%",
            }}
            value={pluginsURL}
            onChange={(event) => {
              setPluginsURL(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            margin="normal"
            required
            id="game"
            label="Game name"
            name="game"
            autoComplete="game"
            sx={{
              width: "30%",
            }}
            value={gameName}
            onChange={(event) => {
              setGameName(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            margin="normal"
            required
            id="config"
            label="Config file name"
            name="config"
            autoComplete="config"
            sx={{
              width: "30%",
            }}
            value={configName}
            onChange={(event) => {
              setConfigName(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
          >
            Upload Background
            <VisuallyHiddenInput
              type="file"
              onChange={(event) => console.log(event.target.files)}
              multiple
            />
          </Button>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
          >
            Upload Logo
            <VisuallyHiddenInput
              type="file"
              onChange={(event) => console.log(event.target.files)}
              multiple
            />
          </Button>
        </Grid>
        <Button
          disabled={disableLauncherCreation}
          variant="contained"
          onClick={() =>
            build_custom_launcher(
              SparusClient,
              launcherName,
              repositoryName,
              gameName,
              updateURL,
              pluginsURL,
              configName,
            )
          }
        >
          Create Launcher
        </Button>
      </Grid>
    </div>
  );
}

export default Launcher;
