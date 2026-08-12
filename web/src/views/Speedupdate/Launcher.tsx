import { useContext, useRef, useState, type ReactNode } from "react";
import { styled } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ImageIcon from "@mui/icons-material/Image";
import SendIcon from "@mui/icons-material/Send";
import BuildIcon from "@mui/icons-material/Build";

import SpeedupdateOptions from "components/Speedupdate/Options";
import { build_custom_launcher, send_event_all } from "utils/sparusrpc";
import { SparusRPC } from "context/Sparus";

const HiddenInput = styled("input")({
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

const SectionCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: `calc(${theme.shape.borderRadius} * 2)`,
  padding: theme.spacing(2),
  height: "100%",

  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(3),
  },
}));

const SectionLabel = styled(Typography)(({ theme }) => ({
  fontFamily: "JetBrains Mono, monospace",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2.5),
}));

interface FilePickerProps {
  label: string;
  icon: ReactNode;
  accept?: string;
  onFile: (file: File | null) => void;
  fileName?: string;
}

function FilePicker({ label, icon, accept, onFile, fileName }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = fileName && fileName.length > 20 ? `${fileName.slice(0, 17)}…` : fileName;

  return (
    <Tooltip title={fileName ?? "No selected file"} placement="top">
      <Button
        component="label"
        variant="outlined"
        size="small"
        startIcon={fileName ? <CheckCircleOutlineIcon color="success" /> : icon}
        sx={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.72rem",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {displayName ?? label}

        <HiddenInput
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
      </Button>
    </Tooltip>
  );
}

// Must stay in sync with sparus.proto's EventType (INSTALL/UPDATE/DELETE).
// A value outside that range makes the Sparus client's `EventType::try_from`
// fail, which ends its stream loop and permanently unsubscribes it -- so the
// launcher stops receiving every later broadcast too.
type EventType = 0 | 1 | 2;

const eventLabels: Record<EventType, string> = {
  0: "Install Plugin",
  1: "Update Plugin",
  2: "Remove Plugin",
};

const eventColors: Record<EventType, "default" | "primary" | "warning" | "error"> = {
  0: "primary",
  1: "default",
  2: "error",
};

function Launcher() {
  const [gameName, setGameName] = useState("");
  const [launcherName, setLauncherName] = useState("");
  const [configName, setConfigName] = useState("Sparus.json");
  const [repositoryName, setRepositoryName] = useState("");
  const [updateURL, setUpdateURL] = useState("repo.marlin-atlas.ts.net");
  const [pluginsURL, setPluginsURL] = useState("");
  const [disableLauncherCreation, setDisableLauncherCreation] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<EventType>(0);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  const [pluginName, setPluginName] = useState("");
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const SparusClient = useContext(SparusRPC);

  const urlAdornment = (
    <InputAdornment position="start">
      <Typography
        component="span"
        sx={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.72rem",
          color: "primary.main",
          userSelect: "none",
        }}
      >
        https://
      </Typography>
    </InputAdornment>
  );

  const handleEventChange = (event: SelectChangeEvent<number>) => {
    setSelectedEvent(event.target.value as EventType);
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard>
            <SectionLabel>// Build Launcher</SectionLabel>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Launcher name"
                  value={launcherName}
                  onChange={(event) => setLauncherName(event.target.value)}
                  slotProps={{
                    htmlInput: {
                      style: {
                        fontFamily: "JetBrains Mono, monospace",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Repository name"
                  value={repositoryName}
                  onChange={(event) => setRepositoryName(event.target.value)}
                  slotProps={{
                    htmlInput: {
                      style: {
                        fontFamily: "JetBrains Mono, monospace",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Game name"
                  value={gameName}
                  onChange={(event) => setGameName(event.target.value)}
                  slotProps={{
                    htmlInput: {
                      style: {
                        fontFamily: "JetBrains Mono, monospace",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Config file"
                  value={configName}
                  onChange={(event) => setConfigName(event.target.value)}
                  slotProps={{
                    htmlInput: {
                      style: {
                        fontFamily: "JetBrains Mono, monospace",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Update server"
                  value={updateURL}
                  onChange={(event) => setUpdateURL(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: urlAdornment,
                      style: {
                        fontFamily: "JetBrains Mono, monospace",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Plugins URL"
                  value={pluginsURL}
                  onChange={(event) => setPluginsURL(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: urlAdornment,
                      style: {
                        fontFamily: "JetBrains Mono, monospace",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={12}>
                <Divider sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Assets
                  </Typography>
                </Divider>

                <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                  <FilePicker
                    label="Background"
                    icon={<ImageIcon />}
                    accept="image/*"
                    onFile={setBgFile}
                    fileName={bgFile?.name}
                  />

                  <FilePicker
                    label="Logo"
                    icon={<CloudUploadIcon />}
                    accept="image/*"
                    onFile={setLogoFile}
                    fileName={logoFile?.name}
                  />
                </Stack>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                disabled={disableLauncherCreation}
                variant="contained"
                startIcon={<BuildIcon />}
                fullWidth
                onClick={() =>
                  build_custom_launcher(
                    SparusClient,
                    launcherName,
                    repositoryName,
                    gameName,
                    `https://${updateURL}`,
                    pluginsURL ? `https://${pluginsURL}` : "",
                    configName,
                  )
                }
                sx={{ maxWidth: { sm: 220 } }}
              >
                Build Launcher
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard>
            <SectionLabel>// Deploy Event</SectionLabel>

            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <Select<number>
                  value={selectedEvent}
                  onChange={handleEventChange}
                  renderValue={(value: number) => (
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Chip
                        label={eventLabels[value as EventType]}
                        color={eventColors[value as EventType]}
                        size="small"
                        sx={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "0.7rem",
                        }}
                      />
                    </Stack>
                  )}
                >
                  {(Object.entries(eventLabels) as [string, string][]).map(([value, label]) => {
                    const event = Number(value) as EventType;

                    return (
                      <MenuItem key={event} value={event}>
                        <Chip
                          label={label}
                          color={eventColors[event]}
                          size="small"
                          sx={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "0.7rem",
                            mr: 1,
                          }}
                        />
                        {label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Plugin name"
                value={pluginName}
                onChange={(event) => setPluginName(event.target.value)}
                placeholder="my-plugin"
                slotProps={{
                  htmlInput: {
                    style: {
                      fontFamily: "JetBrains Mono, monospace",
                    },
                  },
                }}
              />

              <Button
                variant="contained"
                color={
                  eventColors[selectedEvent] === "default" ? "primary" : eventColors[selectedEvent]
                }
                startIcon={<SendIcon />}
                onClick={() => {
                  setBroadcastError(null);
                  // Without this the promise rejection was swallowed, so a
                  // failed broadcast looked exactly like a successful one.
                  send_event_all(SparusClient, selectedEvent, pluginName).catch((err: unknown) => {
                    setBroadcastError(err instanceof Error ? err.message : "broadcast failed");
                  });
                }}
                fullWidth
                sx={{ maxWidth: { sm: 180 } }}
              >
                Broadcast
              </Button>
              {broadcastError ? (
                <Typography variant="body2" color="error">
                  {broadcastError}
                </Typography>
              ) : null}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <SpeedupdateOptions binaryType="launcher" />
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default Launcher;
