import { useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { SectionCard, SectionLabel, MonoCell } from "components/Speedupdate/tableStyles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import TablePagination from "@mui/material/TablePagination";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import BuildIcon from "@mui/icons-material/Build";
import FolderIcon from "@mui/icons-material/Folder";
import InboxIcon from "@mui/icons-material/Inbox";
import { ConnectError } from "@connectrpc/connect";
import { Platforms } from "gen/speedupdate_pb";
import { build, fileToDelete, type BuildOutputChunk } from "utils/speedupdaterpc";
import { PLATFORMS, type PlatformKey, type RepoType } from "utils/platforms";

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

function BinaryCard({
  binary,
  selected,
  onToggle,
}: {
  binary: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      onClick={onToggle}
      sx={(theme) => ({
        px: 2,
        py: 1.25,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        cursor: "pointer",
        bgcolor: selected
          ? `rgba(${theme.vars?.palette.primary.mainChannel ?? "99,102,241"} / 0.06)`
          : "transparent",
        "&:hover": { bgcolor: theme.palette.action.hover },
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Checkbox size="small" color="primary" checked={selected} sx={{ p: 0 }} />
      <Typography
        variant="body2"
        sx={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.8rem",
          flexGrow: 1,
          wordBreak: "break-all",
        }}
      >
        {binary}
      </Typography>
    </Box>
  );
}

function BuildDialog({
  open,
  onClose,
  onBuild,
}: {
  open: boolean;
  onClose: () => void;
  onBuild: (version: string, sourceDir: string, destDir: string) => void;
}) {
  const [version, setVersion] = useState("");
  const [sourceDir, setSourceDir] = useState("");
  const [destDir, setDestDir] = useState("");

  const versionError = version.length > 0 && !SEMVER_RE.test(version);

  const canSubmit = SEMVER_RE.test(version) && sourceDir.trim() !== "" && destDir.trim() !== "";

  const handleBuild = () => {
    if (!canSubmit) return;
    onBuild(version, sourceDir.trim(), destDir.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Build</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Version"
            placeholder="1.0.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            error={versionError}
            helperText={versionError ? "Format semver requis (ex: 1.0.0)" : undefined}
            size="small"
            fullWidth
          />
          <TextField
            label="Source directory"
            value={sourceDir}
            onChange={(e) => setSourceDir(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Destination directory"
            value={destDir}
            onChange={(e) => setDestDir(e.target.value)}
            size="small"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!canSubmit} onClick={handleBuild}>
          Build
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BuildProgressDialog({
  open,
  progress,
  error,
  done,
  onClose,
}: {
  open: boolean;
  progress: number | null;
  error: string | null;
  done: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>Build in progress</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          ) : done ? (
            <Typography variant="body2" color="success.main">
              Build completed.
            </Typography>
          ) : (
            <>
              <LinearProgress
                variant={progress !== null ? "determinate" : "indeterminate"}
                value={progress ?? 0}
              />
              {progress !== null && (
                <Typography variant="caption" color="text.secondary">
                  {progress.toFixed(0)}%
                </Typography>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={!done && !error}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BinariesTable({
  client,
  currentRepo,
  availableBinaries,
  type,
  onError,
}: {
  client: any;
  currentRepo: Map<string, PlatformKey[]>;
  availableBinaries: string[];
  type: RepoType;
  onError: (error: string | null) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [buildDialogOpen, setBuildDialogOpen] = useState(false);
  const [buildProgressOpen, setBuildProgressOpen] = useState(false);
  const [buildProgress, setBuildProgress] = useState<number | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [buildDone, setBuildDone] = useState(false);

  const visible = useMemo(
    () => availableBinaries.slice(page * perPage, page * perPage + perPage),
    [availableBinaries, page, perPage],
  );

  const toggle = (bin: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(bin)) next.delete(bin);
      else next.add(bin);
      return next;
    });

  const deleteSelected = () => {
    onError(null);
    const repo_name = currentRepo.keys().next().value as string;
    const keys = currentRepo.get(repo_name) ?? [];
    const platforms = keys
      .map((k) => PLATFORMS.find((p) => p.key === k)?.enum)
      .filter((p): p is Platforms => p !== undefined);

    selected.forEach((bin) =>
      fileToDelete(client, bin, platforms, type).catch((err: unknown) =>
        onError(ConnectError.from(err).message),
      ),
    );
    setSelected(new Set());
  };

  const handleBuildStart = (version: string, sourceDir: string, destDir: string) => {
    setBuildDialogOpen(false);
    setBuildProgressOpen(true);
    setBuildProgress(null);
    setBuildError(null);
    setBuildDone(false);

    const repo_name = currentRepo.keys().next().value as string;
    const keys = currentRepo.get(repo_name) ?? [];
    const platformKey: string = keys[0] ?? "";
    const path = `${repo_name}/${type}/${platformKey}`;

    const iterator = build(client, path, version, sourceDir, destDir)[Symbol.asyncIterator]();

    const readNext = (): Promise<void> =>
      iterator
        .next()
        .then((result: IteratorResult<BuildOutputChunk, undefined>) => {
          if (result.done) {
            setBuildDone(true);
            return;
          }
          const { downloadedBytesStart, downloadedBytesEnd } = result.value;
          const total = Number(downloadedBytesEnd);
          const current = Number(downloadedBytesStart);
          if (total > 0) {
            setBuildProgress((current / total) * 100);
          }
          return readNext();
        })
        .catch((err: unknown) => {
          setBuildError(ConnectError.from(err).message);
        });

    void readNext();
  };

  const numSelected = selected.size;

  return (
    <>
      <SectionCard>
        <Stack
          direction="row"
          sx={(theme) => ({
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.25,
            bgcolor:
              numSelected > 0
                ? `rgba(${theme.vars?.palette.primary.mainChannel ?? "99,102,241"} / 0.08)`
                : "transparent",
            transition: "background-color 0.2s",
          })}
        >
          {numSelected > 0 ? (
            <Chip
              label={`${numSelected} selected`}
              size="small"
              color="primary"
              variant="filled"
              sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem" }}
            />
          ) : (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <FolderIcon sx={{ fontSize: 16, color: "primary.main" }} />
              <SectionLabel>Binaries</SectionLabel>
              <Chip
                label={availableBinaries.length}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: "0.65rem" }}
              />
            </Stack>
          )}
          {numSelected > 0 && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Build">
                <IconButton size="small" color="primary" onClick={() => setBuildDialogOpen(true)}>
                  <BuildIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete selected">
                <IconButton size="small" color="error" onClick={deleteSelected}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>

        <Divider />

        {availableBinaries.length === 0 ? (
          <Stack spacing={1} sx={{ alignItems: "center", py: 4, color: "text.disabled" }}>
            <InboxIcon sx={{ fontSize: 36, opacity: 0.3 }} />
            <Typography variant="caption">No binaries available</Typography>
          </Stack>
        ) : isMobile ? (
          visible.map((binary) => (
            <BinaryCard
              key={binary}
              binary={binary}
              selected={selected.has(binary)}
              onToggle={() => toggle(binary)}
            />
          ))
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((binary) => (
                  <TableRow
                    key={binary}
                    hover
                    selected={selected.has(binary)}
                    onClick={() => toggle(binary)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox size="small" color="primary" checked={selected.has(binary)} />
                    </TableCell>
                    <MonoCell>{binary}</MonoCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider />

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={availableBinaries.length}
          rowsPerPage={perPage}
          page={page}
          labelRowsPerPage={isMobile ? "" : "Per page"}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </SectionCard>

      <BuildDialog
        open={buildDialogOpen}
        onClose={() => setBuildDialogOpen(false)}
        onBuild={handleBuildStart}
      />

      <BuildProgressDialog
        open={buildProgressOpen}
        progress={buildProgress}
        error={buildError}
        done={buildDone}
        onClose={() => setBuildProgressOpen(false)}
      />
    </>
  );
}

export default BinariesTable;
