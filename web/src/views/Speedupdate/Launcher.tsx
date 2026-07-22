import { useState, useContext } from "react";

import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

// Icons
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

//Components
import Options from "components/Speedupdate/Options";

import { build_custom_launcher, send_event_all } from "utils/sparusrpc";
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
  const [selectedEvent, setSelectedEvent] = useState<number>(0);
  const [pluginName, setPluginName] = useState<string>("");
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
        <Grid size={12}>
          <FormControl>
            <Select
              labelId="select-event"
              id="select-event"
              value={selectedEvent}
              label="Send Event"
              onChange={(event) => setSelectedEvent(event.target.value)}
            >
              <MenuItem value={0}>Install Plugin</MenuItem>
              <MenuItem value={1}>Update Plugin</MenuItem>
              <MenuItem value={2}>Remove Plugin</MenuItem>
              <MenuItem value={3}>Update Frontend</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            id="plugin_name"
            label="Plugin name"
            name="plugin"
            value={pluginName}
            onChange={(event) => {
              setPluginName(event.target.value);
            }}
          />
          <Button
            variant="contained"
            onClick={() =>
              send_event_all(SparusClient, selectedEvent, pluginName)
            }
          >
            Send event
          </Button>
        </Grid>
      </Grid>
      <Options binaryType={"launcher"} />
    </div>
  );
}

export default Launcher;
