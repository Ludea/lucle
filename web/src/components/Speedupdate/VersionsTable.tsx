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
import TextField from "@mui/material/TextField";
import TablePagination from "@mui/material/TablePagination";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Checkbox from "@mui/material/Checkbox";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import AddIcon from "@mui/icons-material/Add";
import HistoryIcon from "@mui/icons-material/History";
import InboxIcon from "@mui/icons-material/Inbox";
import TagIcon from "@mui/icons-material/Tag";
import { ConnectError } from "@connectrpc/connect";
import { setCurrentVersion, registerVersion, unregisterVersion } from "utils/speedupdaterpc";
import { Versions } from "gen/speedupdate_pb";

// Mobile card for a single version
function VersionCard({
  ver,
  selected,
  onToggle,
}: {
  ver: Versions;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      onClick={onToggle}
      sx={(theme) => ({
        px: 2, py: 1.25,
        display: "flex", alignItems: "center", gap: 1.5,
        cursor: "pointer",
        bgcolor: selected
          ? `rgba(${theme.vars?.palette.primary.mainChannel ?? "99,102,241"} / 0.06)`
          : "transparent",
        "&:hover": { bgcolor: theme.palette.action.hover },
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Checkbox size="small" color="primary" checked={selected} sx={{ p: 0 }} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Chip
          label={ver.revision}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", height: 20, mb: 0.25 }}
        />
        {ver.description && (
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {ver.description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function VersionsTable({
  client,
  currentRepo,
  listVersions,
  onError,
}: {
  client: unknown;
  currentRepo: Map<string, string[]>;
  listVersions: Versions[];
  onError: (message: string | null) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newVersion, setNewVersion] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const visible = useMemo(
    () => listVersions.slice(page * perPage, page * perPage + perPage),
    [listVersions, page, perPage],
  );

  const repoName = () => currentRepo.keys().next().value as string;
  const platforms = () => currentRepo.get(repoName());
  const clearSelection = () => setSelected(new Set());
  const numSelected = selected.size;

  const toggle = (revision: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(revision) ? next.delete(revision) : next.add(revision);
      return next;
    });

  const handleSetCurrent = () => {
    const [revision] = selected;
    onError(null);
    setCurrentVersion(client, repoName(), revision, platforms(), "game")
      .then(() => clearSelection())
      .catch((err: unknown) => onError(ConnectError.from(err).message));
  };

  const handleDelete = () => {
    onError(null);
    selected.forEach((revision) =>
      unregisterVersion(client, repoName(), revision, platforms(), "game")
        .then(() => clearSelection())
        .catch((err: unknown) => onError(ConnectError.from(err).message))
    );
  };

  const handleAdd = () => {
    if (!newVersion.trim()) return;
    onError(null);
    const [repo_name] = currentRepo.keys();
    registerVersion(client, repo_name, newVersion.trim(), newDescription.trim(), platforms(), "game")
      .catch((err: unknown) => onError(ConnectError.from(err).message));
    setNewVersion("");
    setNewDescription("");
  };

  return (
    <SectionCard>
      {/* Header */}
      <Stack
        direction="row" alignItems="center" justifyContent="space-between"
        sx={(theme) => ({
          px: 2, py: 1.25,
          bgcolor: numSelected > 0
            ? `rgba(${theme.vars?.palette.primary.mainChannel ?? "99,102,241"} / 0.08)`
            : "transparent",
          transition: "background-color 0.2s",
        })}
      >
        {numSelected > 0 ? (
          <Chip label={`${numSelected} selected`} size="small" color="primary" variant="filled"
            sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem" }} />
        ) : (
          <Stack direction="row" alignItems="center" spacing={1}>
            <HistoryIcon sx={{ fontSize: 16, color: "primary.main" }} />
            <SectionLabel>Versions</SectionLabel>
            <Chip label={listVersions.length} size="small" variant="outlined"
              sx={{ height: 18, fontSize: "0.65rem" }} />
          </Stack>
        )}
        {numSelected > 0 && (
          <Stack direction="row" spacing={0.5}>
            {numSelected === 1 && (
              <Tooltip title="Set as current version">
                <IconButton size="small" color="success" onClick={handleSetCurrent}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={handleDelete}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      <Divider />

      {/* Content */}
      {listVersions.length === 0 ? (
        <Stack alignItems="center" spacing={1} py={4} color="text.disabled">
          <InboxIcon sx={{ fontSize: 36, opacity: 0.3 }} />
          <Typography variant="caption">No versions yet</Typography>
        </Stack>
      ) : isMobile ? (
        visible.map((ver) => (
          <VersionCard key={ver.revision} ver={ver} selected={selected.has(ver.revision)}
            onToggle={() => toggle(ver.revision)} />
        ))
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Revision</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((ver) => (
                <TableRow key={ver.revision} hover selected={selected.has(ver.revision)}
                  onClick={() => toggle(ver.revision)} sx={{ cursor: "pointer" }}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" color="primary" checked={selected.has(ver.revision)} />
                  </TableCell>
                  <MonoCell>
                    <Chip label={ver.revision} size="small" variant="outlined" color="primary"
                      sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", height: 20 }} />
                  </MonoCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                      {ver.description || "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider />

      {/* Add version footer */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        spacing={1}
        sx={(theme) => ({ px: 2, py: 1.5, bgcolor: theme.palette.action.hover })}
      >
        <TagIcon sx={{ fontSize: 16, color: "text.disabled", display: { xs: "none", sm: "block" } }} />
        <TextField
          size="small"
          placeholder="1.0.0"
          label="Version"
          value={newVersion}
          onChange={(e) => setNewVersion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          sx={{ width: { xs: "100%", sm: 140 } }}
          slotProps={{ htmlInput: { style: { fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem" } } }}
        />
        <TextField
          size="small"
          placeholder="Release notes…"
          label="Description"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          sx={{ flexGrow: 1, width: { xs: "100%", sm: "auto" } }}
          slotProps={{ htmlInput: { style: { fontSize: "0.8rem" } } }}
        />
        <Tooltip title="Add version">
          <span>
            <IconButton size="small" color="primary" onClick={handleAdd} disabled={!newVersion.trim()}>
              <AddIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Divider />

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={listVersions.length}
        rowsPerPage={perPage}
        page={page}
        labelRowsPerPage={isMobile ? "" : "Per page"}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </SectionCard>
  );
}

export default VersionsTable;
