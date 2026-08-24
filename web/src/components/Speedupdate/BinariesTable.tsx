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
import FolderIcon from "@mui/icons-material/Folder";
import InboxIcon from "@mui/icons-material/Inbox";
import { ConnectError } from "@connectrpc/connect";
import { fileToDelete } from "utils/speedupdaterpc";

// Mobile card for a single binary
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

function BinariesTable({
  client,
  currentRepo,
  availableBinaries,
  onError,
}: {
  client: unknown;
  currentRepo: Map<string, string[]>;
  availableBinaries: string[];
  onError: (error: string | null) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => availableBinaries.slice(page * perPage, page * perPage + perPage),
    [availableBinaries, page, perPage],
  );

  const toggle = (bin: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(bin) ? next.delete(bin) : next.add(bin);
      return next;
    });

  const deleteSelected = () => {
    onError(null);
    const repo_name = currentRepo.keys().next().value as string;
    const platforms = currentRepo.get(repo_name);
    selected.forEach((bin) =>
      fileToDelete(client, bin, platforms, "game").catch((err: unknown) =>
        onError(ConnectError.from(err).message),
      ),
    );
    setSelected(new Set());
  };

  const numSelected = selected.size;

  return (
    <SectionCard>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={(theme) => ({
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
          <Stack direction="row" alignItems="center" spacing={1}>
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
          <Tooltip title="Delete selected">
            <IconButton size="small" color="error" onClick={deleteSelected}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Divider />

      {availableBinaries.length === 0 ? (
        <Stack alignItems="center" spacing={1} py={4} color="text.disabled">
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
  );
}

export default BinariesTable;
