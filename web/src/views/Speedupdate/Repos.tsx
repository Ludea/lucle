import { useState, useEffect, useContext } from "react";
import { styled } from "@mui/material/styles";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import LinkIcon from "@mui/icons-material/Link";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import StorageIcon from "@mui/icons-material/Storage";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { useNavigate } from "react-router";
import { ConnectError } from "@connectrpc/connect";
import { Platforms } from "gen/speedupdate_pb";

import { useAuth } from "context/Auth";
import { LucleRPC } from "context/Luclerpc";
import { SpeedupdateRPC } from "context/Speedupdate";
import { init, isInit, repoToDelete } from "utils/speedupdaterpc";
import { registerUpdateServer, deleteRepo, listRepositories } from "utils/rpc";

interface AuthContextValue {
  username: string | null;
  token: string | null;
  Login: (credentials: { username: string; password: string }) => Promise<unknown>;
  Logout: () => void;
}

// ─── Styled ───────────────────────────────────────────────────────────────────

const SectionCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: `calc(${theme.shape.borderRadius} * 2)`,
  padding: theme.spacing(2),
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

const RepoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:last-child": { borderBottom: "none" },
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1.5),
  },
}));

type PlatformKey = "win64" | "macos_x86_64" | "macos_arm64" | "linux";
type DeleteTarget = "game" | "launcher" | "both";

const PLATFORMS: { key: PlatformKey; label: string; enum: Platforms }[] = [
  { key: "win64", label: "Windows x64", enum: Platforms.WIN64 },
  { key: "macos_x86_64", label: "macOS x86_64", enum: Platforms.MACOS_X86_64 },
  { key: "macos_arm64", label: "macOS arm64", enum: Platforms.MACOS_ARM64 },
  { key: "linux", label: "Linux", enum: Platforms.LINUX },
];

const PLATFORM_COLORS: Record<PlatformKey, "default" | "primary" | "secondary" | "warning"> = {
  win64: "primary",
  macos_x86_64: "secondary",
  macos_arm64: "secondary",
  linux: "warning",
};

// ─── DeleteRepoDialog ─────────────────────────────────────────────────────────

function DeleteRepoDialog({
  repoName,
  open,
  onClose,
  onConfirm,
}: {
  repoName: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (target: DeleteTarget) => void;
}) {
  const [target, setTarget] = useState<DeleteTarget>("both");

  function handleClose() {
    setTarget("both");
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.5}>
          <WarningAmberIcon color="error" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Delete repository
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          This will permanently delete all data. This action cannot be undone.
        </Alert>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Select what to delete for <strong>{repoName}</strong>:
        </Typography>

        <ToggleButtonGroup
          value={target}
          exclusive
          onChange={(_, v) => v && setTarget(v)}
          fullWidth
          size="small"
          orientation="vertical"
          sx={{ gap: 0.75 }}
        >
          <ToggleButton
            value="game"
            sx={{
              justifyContent: "flex-start",
              gap: 1,
              textTransform: "none",
              borderRadius: "8px !important",
              border: "1px solid !important",
              borderColor: "divider !important",
              "&.Mui-selected": {
                bgcolor: "error.main",
                color: "error.contrastText",
                borderColor: "error.main !important",
                "&:hover": { bgcolor: "error.dark" },
              },
            }}
          >
            <SportsEsportsIcon fontSize="small" />
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Game
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Delete game binaries, packages and versions
              </Typography>
            </Box>
          </ToggleButton>

          <ToggleButton
            value="launcher"
            sx={{
              justifyContent: "flex-start",
              gap: 1,
              textTransform: "none",
              borderRadius: "8px !important",
              border: "1px solid !important",
              borderColor: "divider !important",
              "&.Mui-selected": {
                bgcolor: "error.main",
                color: "error.contrastText",
                borderColor: "error.main !important",
                "&:hover": { bgcolor: "error.dark" },
              },
            }}
          >
            <RocketLaunchIcon fontSize="small" />
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Launcher
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Delete launcher binaries, packages and versions
              </Typography>
            </Box>
          </ToggleButton>

          <ToggleButton
            value="both"
            sx={{
              justifyContent: "flex-start",
              gap: 1,
              textTransform: "none",
              borderRadius: "8px !important",
              border: "1px solid !important",
              borderColor: "divider !important",
              "&.Mui-selected": {
                bgcolor: "error.main",
                color: "error.contrastText",
                borderColor: "error.main !important",
                "&:hover": { bgcolor: "error.dark" },
              },
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Both
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Delete the entire repository and all its data
              </Typography>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} variant="outlined" size="small">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onConfirm(target);
            handleClose();
          }}
          variant="contained"
          color="error"
          size="small"
          startIcon={<DeleteOutlineIcon />}
        >
          Delete {target === "both" ? "repository" : target}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── ListRepo ─────────────────────────────────────────────────────────────────

function ListRepo() {
  const [listRepo, setListRepo] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinPath, setJoinPath] = useState("");
  const [createPath, setCreatePath] = useState("");
  const [deleteRepo_, setDeleteRepo_] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<PlatformKey, boolean>>({
    win64: false,
    macos_x86_64: false,
    macos_arm64: false,
    linux: false,
  });

  const lucleClient = useContext(LucleRPC);
  const speedupdateClient = useContext(SpeedupdateRPC);
  const auth = useAuth() as AuthContextValue | undefined;
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth?.username) return;
    setLoading(true);
    listRepositories(lucleClient, auth.username)
      .then((res: any) => {
        const map = new Map<string, string[]>();
        for (const repo of res.repositories ?? []) {
          map.set(repo.path, repo.platforms ?? []);
        }
        setListRepo(map);
      })
      .catch((err: unknown) => setError(ConnectError.from(err).message))
      .finally(() => setLoading(false));
  }, [auth?.username, lucleClient]);

  const getSelectedPlatforms = (): Platforms[] =>
    PLATFORMS.filter((p) => checked[p.key]).map((p) => p.enum);

  const getSelectedKeys = (): string[] => PLATFORMS.filter((p) => checked[p.key]).map((p) => p.key);

  const handleToggle = (key: PlatformKey) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const navigateToRepo = (repo_name: string, type: "game" | "launcher") => {
    setError(null);
    const platforms = listRepo.get(repo_name);
    isInit(speedupdateClient, repo_name, platforms, type)
      .then(() => {
        localStorage.setItem("current_repo", JSON.stringify({ repo_name, platforms }));
        navigate(`${repo_name}/${type}`);
      })
      .catch((err: unknown) => setError(ConnectError.from(err).message));
  };

  const handleCreate = () => {
    setError(null);
    init(speedupdateClient, createPath, checked)
      .then(() => {
        const platformsEnum = getSelectedPlatforms();
        const platformsKeys = getSelectedKeys();
        const updated = new Map(listRepo);
        updated.set(createPath, platformsKeys);
        setListRepo(updated);
        setCreatePath("");
        if (auth?.username) {
          registerUpdateServer(lucleClient, auth.username, createPath, platformsEnum).catch(
            (err: unknown) => setError(ConnectError.from(err).message),
          );
        }
      })
      .catch((err: unknown) => setError(ConnectError.from(err).message));
  };

  const handleDeleteConfirm = (repoName: string, target: DeleteTarget) => {
    setError(null);
    const doDelete = (binaryType: "game" | "launcher") => repoToDelete(speedupdateClient, repoName);

    const tasks: Promise<unknown>[] = [];

    if (target === "game" || target === "both") tasks.push(doDelete("game"));
    if (target === "launcher" || target === "both") tasks.push(doDelete("launcher"));

    Promise.all(tasks)
      .then(() => {
        if (target === "both") {
          return deleteRepo(lucleClient, repoName).then(() => {
            const updated = new Map(listRepo);
            updated.delete(repoName);
            setListRepo(updated);
          });
        }
      })
      .catch((err: unknown) => setError(ConnectError.from(err).message));
  };

  const anyPlatformSelected = getSelectedKeys().length > 0;

  return (
    <Stack spacing={3}>
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem" }}
        >
          {error}
        </Alert>
      )}

      {/* Repositories list */}
      <SectionCard>
        <SectionLabel>// Repositories</SectionLabel>

        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2].map((i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="rounded" width="40%" height={20} />
                <Box sx={{ flexGrow: 1 }} />
                <Skeleton variant="rounded" width={70} height={28} />
                <Skeleton variant="rounded" width={80} height={28} />
              </Box>
            ))}
          </Stack>
        ) : listRepo.size === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem" }}
          >
            No repositories found.
          </Typography>
        ) : (
          Array.from(listRepo.entries()).map(([repo_name, platforms]) => (
            <RepoRow key={repo_name}>
              <Box sx={{ minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ minWidth: 0, mb: 0.5, alignItems: "center" }}
                >
                  <StorageIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {repo_name}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  sx={{ pl: "28px", flexWrap: "wrap" }}
                >
                  {platforms.map((p) => (
                    <Chip
                      key={p}
                      label={p}
                      size="small"
                      color={PLATFORM_COLORS[p as PlatformKey] ?? "default"}
                      sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem" }}
                    />
                  ))}
                </Stack>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  flexShrink: 0,
                  "& .MuiButton-root": { flex: { xs: 1, sm: "none" } },
                }}
              >
                <Tooltip title="Open in game mode">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SportsEsportsIcon />}
                    onClick={() => navigateToRepo(repo_name, "game")}
                    sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem" }}
                  >
                    Game
                  </Button>
                </Tooltip>
                <Tooltip title="Open in launcher mode">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RocketLaunchIcon />}
                    onClick={() => navigateToRepo(repo_name, "launcher")}
                    sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem" }}
                  >
                    Launcher
                  </Button>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => setDeleteRepo_(repo_name)}
                    sx={(theme) => ({
                      color: "error.main",
                      border: `1px solid ${theme.palette.error.main}33`,
                      borderRadius: 1.5,
                      p: 0.5,
                      "&:hover": {
                        bgcolor: "error.main",
                        color: "error.contrastText",
                        borderColor: "error.main",
                      },
                      transition: "all 0.15s",
                    })}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </RepoRow>
          ))
        )}
      </SectionCard>

      {/* Join / Create */}
      <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard sx={{ height: "100%" }}>
            <SectionLabel>// Join Repository</SectionLabel>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Path"
                value={joinPath}
                onChange={(e) => setJoinPath(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <FolderOpenIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    style: { fontFamily: "JetBrains Mono, monospace" },
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={<LinkIcon />}
                disabled={!joinPath.trim()}
                fullWidth
                sx={{ maxWidth: { sm: 200 } }}
              >
                Join Repository
              </Button>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard sx={{ height: "100%" }}>
            <SectionLabel>// Create Repository</SectionLabel>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Path"
                value={createPath}
                onChange={(e) => setCreatePath(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <FolderOpenIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    style: { fontFamily: "JetBrains Mono, monospace" },
                  },
                }}
              />
              <Box>
                <FormLabel
                  sx={{
                    fontSize: "0.75rem",
                    fontFamily: "JetBrains Mono, monospace",
                    mb: 1,
                    display: "block",
                  }}
                >
                  Platforms
                </FormLabel>
                <FormGroup>
                  <Grid container spacing={0}>
                    {PLATFORMS.map((p) => (
                      <Grid key={p.key} size={{ xs: 6 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={checked[p.key]}
                              onChange={() => handleToggle(p.key)}
                            />
                          }
                          label={
                            <Typography
                              sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.78rem" }}
                            >
                              {p.label}
                            </Typography>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!createPath.trim() || !anyPlatformSelected}
                onClick={handleCreate}
                fullWidth
                sx={{ maxWidth: { sm: 220 } }}
              >
                Create Repository
              </Button>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      {/* Delete dialog */}
      <DeleteRepoDialog
        repoName={deleteRepo_ ?? ""}
        open={deleteRepo_ !== null}
        onClose={() => setDeleteRepo_(null)}
        onConfirm={(target) => {
          if (deleteRepo_) handleDeleteConfirm(deleteRepo_, target);
        }}
      />

      <Divider />
    </Stack>
  );
}

export default ListRepo;
