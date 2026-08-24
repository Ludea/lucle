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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import PublishIcon from "@mui/icons-material/Publish";
import InventoryIcon from "@mui/icons-material/Inventory";
import InboxIcon from "@mui/icons-material/Inbox";
import { ConnectError } from "@connectrpc/connect";
import { registerPackage, unregisterPackage, fileToDelete } from "utils/speedupdaterpc";

type PackageEntry = { name: string; published: boolean };

function PublishedChip({ published }: { published: boolean }) {
  return (
    <Chip
      label={published ? "published" : "draft"}
      size="small"
      color={published ? "success" : "default"}
      variant={published ? "filled" : "outlined"}
      sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", height: 20 }}
    />
  );
}

// Mobile card for a single package
function PackageCard({
  pack,
  selected,
  onToggle,
}: {
  pack: PackageEntry;
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
        <Typography variant="body2"
          sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem", wordBreak: "break-all" }}>
          {pack.name}
        </Typography>
      </Box>
      <PublishedChip published={pack.published} />
    </Box>
  );
}

function PackagesTable({
  client,
  currentRepo,
  listPackages,
  onError,
}: {
  client: unknown;
  currentRepo: Map<string, string[]>;
  listPackages: PackageEntry[];
  onError: (error: string | null) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(5);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => listPackages.slice(page * perPage, page * perPage + perPage),
    [listPackages, page, perPage],
  );

  const selectedEntries = useMemo(
    () => listPackages.filter((p) => selected.has(p.name)),
    [listPackages, selected],
  );

  const allPublished = selectedEntries.length > 0 && selectedEntries.every((p) => p.published);
  const allUnpublished = selectedEntries.length > 0 && selectedEntries.every((p) => !p.published);

  const repoName = () => currentRepo.keys().next().value as string;
  const platforms = () => currentRepo.get(repoName());
  const clearSelection = () => setSelected(new Set());

  const toggle = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const registerPackages = () => {
    onError(null);
    selected.forEach((pack) =>
      registerPackage(client, repoName(), pack, platforms(), "game")
        .catch((err: unknown) => onError(ConnectError.from(err).message))
    );
    clearSelection();
  };

  const unregisterPackages = () => {
    onError(null);
    selected.forEach((pack) =>
      unregisterPackage(client, repoName(), pack, platforms(), "game")
        .catch((err: unknown) => onError(ConnectError.from(err).message))
    );
    clearSelection();
  };

  const deletePackages = () => {
    onError(null);
    selectedEntries.forEach((pack) => {
      if (pack.published) {
        unregisterPackage(client, repoName(), pack.name, platforms(), "game")
          .catch((err: unknown) => onError(ConnectError.from(err).message));
      }
      fileToDelete(client, pack.name, platforms(), "game")
        .catch((err: unknown) => onError(ConnectError.from(err).message));
    });
    clearSelection();
  };

  const numSelected = selected.size;

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
            <InventoryIcon sx={{ fontSize: 16, color: "primary.main" }} />
            <SectionLabel>Packages</SectionLabel>
            <Chip label={listPackages.length} size="small" variant="outlined"
              sx={{ height: 18, fontSize: "0.65rem" }} />
          </Stack>
        )}
        {numSelected > 0 && (
          <Stack direction="row" spacing={0.5}>
            {allPublished && (
              <Tooltip title="Unpublish">
                <IconButton size="small" color="warning" onClick={unregisterPackages}>
                  <UnpublishedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {allUnpublished && (
              <Tooltip title="Publish">
                <IconButton size="small" color="success" onClick={registerPackages}>
                  <PublishIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={deletePackages}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      <Divider />

      {listPackages.length === 0 ? (
        <Stack alignItems="center" spacing={1} py={4} color="text.disabled">
          <InboxIcon sx={{ fontSize: 36, opacity: 0.3 }} />
          <Typography variant="caption">No packages yet</Typography>
        </Stack>
      ) : isMobile ? (
        visible.map((pack) => (
          <PackageCard key={pack.name} pack={pack} selected={selected.has(pack.name)}
            onToggle={() => toggle(pack.name)} />
        ))
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((pack) => (
                <TableRow key={pack.name} hover selected={selected.has(pack.name)}
                  onClick={() => toggle(pack.name)} sx={{ cursor: "pointer" }}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" color="primary" checked={selected.has(pack.name)} />
                  </TableCell>
                  <MonoCell>{pack.name}</MonoCell>
                  <TableCell><PublishedChip published={pack.published} /></TableCell>
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
        count={listPackages.length}
        rowsPerPage={perPage}
        page={page}
        labelRowsPerPage={isMobile ? "" : "Per page"}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </SectionCard>
  );
}

export default PackagesTable;
