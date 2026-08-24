import { useContext, useRef, useState, type ReactNode } from "react";
import { styled, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import BuildIcon from "@mui/icons-material/Build";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SendIcon from "@mui/icons-material/Send";

import { build_custom_launcher, send_event_all } from "utils/sparusrpc";
import { SparusRPC } from "context/Sparus";
import SpeedupdateTables from "components/Speedupdate/SpeedupdateTables";

// ─── Styled ───────────────────────────────────────────────────────────────────

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
  borderRadius: `calc(${theme.shape.borderRadius}px * 2)`,
  padding: theme.spacing(2),
  height: "100%",
  [theme.breakpoints.up("sm")]: { padding: theme.spacing(3) },
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

const monoInput = { style: { fontFamily: "JetBrains Mono, monospace" } };

// ─── FilePicker ───────────────────────────────────────────────────────────────

interface FilePickerProps {
  label:     string;
  icon:      ReactNode;
  accept?:   string;
  onFile:    (file: File | null) => void;
  fileName?: string;
}

function FilePicker({ label, icon, accept, onFile, fileName }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayName = fileName && fileName.length > 20 ? `${fileName.slice(0, 17)}…` : fileName;

  return (
    <Tooltip title={fileName ?? "No file selected"} placement="top">
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
        <HiddenInput ref={inputRef} type="file" accept={accept}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </Button>
    </Tooltip>
  );
}

// ─── Url Adornment ────────────────────────────────────────────────────────────

const UrlAdornment = (
  <InputAdornment position="start">
    <Typography component="span" sx={{
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "0.72rem",
      color: "primary.main",
      userSelect: "none",
    }}>
      https://
    </Typography>
  </InputAdornment>
);

// ─── BuildLauncherDialog ──────────────────────────────────────────────────────

function BuildLauncherDialog({
  open,
  onClose,
  SparusClient,
}: {
  open:         boolean;
  onClose:      () => void;
  SparusClient: unknown;
}) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [launcherName, setLauncherName] = useState("");
  const [repositoryName, setRepositoryName] = useState("");
  const [gameName, setGameName] = useState("");
  const [configName, setConfigName] = useState("Sparus.json");
  const [updateURL, setUpdateURL] = useState("repo.marlin-atlas.ts.net");
  const [cmsURL, setCmsURL] = useState("");
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setLauncherName("");
    setRepositoryName("");
    setGameName("");
    setConfigName("Sparus.json");
    setUpdateURL("repo.marlin-atlas.ts.net");
    setCmsURL("");
    setBgFile(null);
    setLogoFile(null);
    setError(null);
    setSuccess(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate(): string | null {
    if (!launcherName.trim()) return "Launcher name is required";
    if (!repositoryName.trim()) return "Repository name is required";
    if (!gameName.trim()) return "Game name is required";
    if (!updateURL.trim()) return "Update server is required";
    return null;
  }

  function handleBuild() {
    const err = validate();
    if (err) { setError(err); return; }

    setError(null);
    setBuilding(true);
    setSuccess(false);

    build_custom_launcher(
      SparusClient,
      launcherName.trim(),
      repositoryName.trim(),
      gameName.trim(),
      `https://${updateURL.trim()}`,
      `https://${cmsURL.trim()}`,
      configName.trim(),
    )
      .then(() => setSuccess(true))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Build failed"))
      .finally(() => setBuilding(false));
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
    >
      {building && (
        <LinearProgress
          sx={{ position: "absolute", top: 0, left: 0, right: 0 }}
        />
      )}

      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <BuildIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>Build launcher</Typography>
          </Stack>
          {isMobile && (
            <IconButton size="small" onClick={handleClose} disabled={building}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={0.5} sx={{ pt: 0.5 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 1 }} onClose={() => setSuccess(false)}>
              Launcher build started successfully.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required size="small" label="Launcher name"
                value={launcherName} onChange={(e) => setLauncherName(e.target.value)}
                disabled={building} slotProps={{ htmlInput: monoInput }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required size="small" label="Repository name"
                value={repositoryName} onChange={(e) => setRepositoryName(e.target.value)}
                disabled={building} slotProps={{ htmlInput: monoInput }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required size="small" label="Game name"
                value={gameName} onChange={(e) => setGameName(e.target.value)}
                disabled={building} slotProps={{ htmlInput: monoInput }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required size="small" label="Config file"
                value={configName} onChange={(e) => setConfigName(e.target.value)}
                disabled={building} slotProps={{ htmlInput: monoInput }} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth required size="small" label="Update server"
                value={updateURL} onChange={(e) => setUpdateURL(e.target.value)}
                disabled={building}
                slotProps={{ input: { startAdornment: UrlAdornment, ...monoInput } }} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="CMS URL"
                value={cmsURL} onChange={(e) => setCmsURL(e.target.value)}
                disabled={building}
                slotProps={{ input: { startAdornment: UrlAdornment, ...monoInput } }} />
            </Grid>
            <Grid size={12}>
              <Divider sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Assets</Typography>
              </Divider>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <FilePicker label="Background" icon={<ImageIcon />} accept="image/*"
                  onFile={setBgFile} fileName={bgFile?.name} />
                <FilePicker label="Logo" icon={<CloudUploadIcon />} accept="image/*"
                  onFile={setLogoFile} fileName={logoFile?.name} />
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: isMobile ? 3 : 2.5 }}>
        {!isMobile && (
          <Button onClick={handleClose} variant="outlined" size="small" disabled={building}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleBuild}
          variant="contained"
          size="small"
          disabled={building}
          fullWidth={isMobile}
          startIcon={<BuildIcon />}
        >
          {building ? "Building…" : "Build"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Event types ──────────────────────────────────────────────────────────────

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

// ─── WorkflowDialog ───────────────────────────────────────────────────────────

function WorkflowDialog({
  open,
  onClose,
  SparusClient,
}: {
  open:         boolean;
  onClose:      () => void;
  SparusClient: unknown;
}) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedEvent, setSelectedEvent] = useState<EventType>(0);
  const [pluginName, setPluginName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleClose() {
    setPluginName("");
    setError(null);
    setSent(false);
    onClose();
  }

  function handleBroadcast() {
    setError(null);
    setSent(false);
    send_event_all(SparusClient, selectedEvent, pluginName)
      .then(() => setSent(true))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Broadcast failed")
      );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <RocketLaunchIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>Deploy event</Typography>
          </Stack>
          {isMobile && (
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {sent && (
            <Alert severity="success" onClose={() => setSent(false)}>
              Event broadcast successfully.
            </Alert>
          )}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
          )}

          <FormControl fullWidth size="small">
            <Select<number>
              value={selectedEvent}
              onChange={(e: SelectChangeEvent<number>) =>
                setSelectedEvent(e.target.value as EventType)
              }
              renderValue={(value: number) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={eventLabels[value as EventType]}
                    color={eventColors[value as EventType]}
                    size="small"
                    sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem" }}
                  />
                </Stack>
              )}
            >
              {(Object.entries(eventLabels) as [string, string][]).map(([value, label]) => {
                const event = Number(value) as EventType;
                return (
                  <MenuItem key={event} value={event}>
                    <Chip label={label} color={eventColors[event]} size="small"
                      sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", mr: 1 }} />
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <TextField
            fullWidth size="small" label="Plugin name"
            value={pluginName} onChange={(e) => setPluginName(e.target.value)}
            placeholder="my-plugin"
            onKeyDown={(e) => { if (e.key === "Enter") handleBroadcast(); }}
            slotProps={{ htmlInput: { style: { fontFamily: "JetBrains Mono, monospace" } } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: isMobile ? 3 : 2.5 }}>
        {!isMobile && (
          <Button onClick={handleClose} variant="outlined" size="small">Cancel</Button>
        )}
        <Button
          onClick={handleBroadcast}
          variant="contained"
          size="small"
          disabled={!pluginName.trim()}
          fullWidth={isMobile}
          color={eventColors[selectedEvent] === "default" ? "primary" : eventColors[selectedEvent]}
          startIcon={<SendIcon />}
        >
          Broadcast
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Launcher ─────────────────────────────────────────────────────────────────

function Launcher() {
  const SparusClient = useContext(SparusRPC);
  const [buildOpen, setBuildOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);

  return (
    <Stack spacing={3}>
      {/* Page header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={1}
      >
        <Box>
          <SectionLabel sx={{ mb: 0 }}>// Launcher</SectionLabel>
          <Typography variant="body2" color="text.secondary">
            Manage versions, packages and binaries.
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<RocketLaunchIcon />}
            onClick={() => setWorkflowOpen(true)}
          >
            Deploy event
          </Button>
          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<BuildIcon />}
            onClick={() => setBuildOpen(true)}
          >
            New launcher
          </Button>
        </Stack>
      </Stack>

      {/* Tables */}
      <SectionCard>
        <SpeedupdateTables binaryType="launcher" onError={() => {}} />
      </SectionCard>

      <BuildLauncherDialog
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        SparusClient={SparusClient}
      />
      <WorkflowDialog
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        SparusClient={SparusClient}
      />
    </Stack>
  );
}

export default Launcher;
