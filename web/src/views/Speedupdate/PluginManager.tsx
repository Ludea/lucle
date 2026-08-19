import { useState, useCallback, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarQuickFilter,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from "@mui/x-data-grid";

//Icons
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import StarIcon from "@mui/icons-material/Star";
import DownloadIcon from "@mui/icons-material/Download";

import { listPlugins, togglePlugin, removePlugin } from "utils/rpc";
import type { InstalledPlugin as ProtoPlugin } from "gen/luclerpc_pb";

type Category = "ui" | "backend" | "auth" | "devtools" | "gaming" | "theme";

interface InstalledPlugin {
  id:          string;
  name:        string;
  icon:        string;
  author:      string;
  version:     string;
  category:    Category;
  priceType:   string;
  description: string;
  tags:        string[];
  downloads:   number;
  stars:       number;
  featured:    boolean;
  enabled:     boolean;
  installedAt: string;
}

function protoToPlugin(p: ProtoPlugin): InstalledPlugin {
  return {
    id:          p.id,
    name:        p.name,
    icon:        p.icon,
    author:      p.author,
    version:     p.version,
    category:    p.category as Category,
    priceType:   p.priceType,
    description: p.description,
    tags:        p.tags,
    downloads:   p.downloads,
    stars:       p.stars,
    featured:    p.featured,
    enabled:     p.enabled,
    installedAt: new Date(Number(p.installedAt) * 1000).toLocaleDateString(),
  };
}

const CATEGORY_COLOR: Record<
  Category,
  "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success"
> = {
  ui: "info", backend: "secondary", auth: "error",
  devtools: "warning", gaming: "success", theme: "primary",
};

const PRICE_LABEL: Record<string, string> = {
  free: "Free", paid: "Paid", subscription: "Subscription",
};

function UninstallDialog({
  plugin,
  onConfirm,
  onClose,
}: {
  plugin: InstalledPlugin | null;
  onConfirm: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plugin) return null;

  function handleConfirm() {
    setLoading(true);
    setError(null);
    onConfirm(plugin!.id)
      .then(() => onClose())
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <WarningAmberIcon color="warning" />
          <Typography variant="subtitle1" fontWeight={700}>Uninstall plugin</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action cannot be undone. Any data stored by this plugin will be lost.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          You are about to uninstall <strong>{plugin.name}</strong> v{plugin.version}.
          {plugin.priceType !== "free" && (
            <> Your license will remain valid and you can reinstall it from the store.</>
          )}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="outlined" size="small" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error" size="small"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineIcon />}>
          {loading ? "Removing…" : "Uninstall"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Toolbar() {
  return (
    <GridToolbarContainer sx={{ px: 2, py: 1, gap: 1 }}>
      <GridToolbarQuickFilter size="small" placeholder="Search plugins…"
        sx={{ flexGrow: 1, maxWidth: 320 }} />
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  );
}

export default function PluginManager() {
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uninstallPlugin, setUninstallPlugin] = useState<InstalledPlugin | null>(null);

  useEffect(() => {
    listPlugins()
      .then((rows) => setPlugins(rows.map(protoToPlugin)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback((id: string) => {
    togglePlugin(id)
      .then((updated) =>
        setPlugins((prev) =>
          prev.map((p) => p.id === id ? protoToPlugin(updated) : p)
        )
      )
      .catch((e: Error) => setError(e.message));
  }, []);

  const handleUninstall = useCallback((id: string) => {
    return removePlugin(id).then(() =>
      setPlugins((prev) => prev.filter((p) => p.id !== id))
    );
  }, []);

  const columns: GridColDef<InstalledPlugin>[] = [
    {
      field: "name",
      headerName: "Plugin",
      flex: 1.8,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<InstalledPlugin>) => (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
          <Avatar sx={(theme) => ({
            width: 30, height: 30, fontSize: "0.95rem",
            bgcolor: theme.palette.action.hover,
            border: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          })}>
            {params.row.icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {params.row.name}
              </Typography>
              {params.row.featured && (
                <Chip label="Featured" size="small" color="primary" variant="outlined"
                  sx={{ height: 16, fontSize: "0.6rem" }} />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.author}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: "version",
      headerName: "Version",
      width: 90,
      renderCell: (params) => (
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
          v{params.value}
        </Typography>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small"
          color={CATEGORY_COLOR[params.value as Category]}
          variant="filled" sx={{ height: 20, fontSize: "0.65rem" }} />
      ),
    },
    {
      field: "priceType",
      headerName: "License",
      width: 110,
      renderCell: (params: GridRenderCellParams<InstalledPlugin>) => (
        <Chip label={PRICE_LABEL[params.row.priceType] ?? params.row.priceType}
          size="small" variant="outlined"
          color={params.row.priceType === "free" ? "default" : "warning"}
          sx={{ height: 20, fontSize: "0.65rem" }} />
      ),
    },
    {
      field: "downloads",
      headerName: "Downloads",
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={0.4}>
          <DownloadIcon sx={{ fontSize: 13, color: "text.disabled" }} />
          <Typography variant="caption" color="text.secondary">
            {params.value >= 1000 ? `${(params.value / 1000).toFixed(1)}k` : params.value}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "stars",
      headerName: "Stars",
      width: 80,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={0.4}>
          <StarIcon sx={{ fontSize: 13, color: "warning.main" }} />
          <Typography variant="caption" color="text.secondary">{params.value}</Typography>
        </Stack>
      ),
    },
    {
      field: "installedAt",
      headerName: "Installed",
      width: 110,
      renderCell: (params) => (
        <Typography variant="caption" color="text.secondary">{params.value}</Typography>
      ),
    },
    {
      field: "enabled",
      headerName: "Status",
      width: 130,
      renderCell: (params: GridRenderCellParams<InstalledPlugin>) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Switch size="small" checked={params.row.enabled}
            onChange={() => handleToggle(params.row.id)} color="success" />
          <Stack direction="row" alignItems="center" spacing={0.4}>
            <FiberManualRecordIcon sx={{
              fontSize: 8,
              color: params.row.enabled ? "success.main" : "text.disabled",
            }} />
            <Typography variant="caption" color="text.secondary">
              {params.row.enabled ? "Active" : "Inactive"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<InstalledPlugin>) => (
        <Tooltip title="Uninstall">
          <IconButton size="small" color="error"
            onClick={() => setUninstallPlugin(params.row)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const activeCount = plugins.filter((p) => p.enabled).length;

  return (
    <Box sx={{ width: "100%", maxWidth: 1200 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} letterSpacing="-0.02em">
            Installed Plugins
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {plugins.length} installed · {activeCount} active
          </Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<StorefrontIcon />} href="/plugins">
          Browse store
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <Box sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2, overflow: "hidden",
      })}>
        <DataGrid
          rows={plugins}
          columns={columns}
          rowHeight={56}
          autoHeight
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: "installedAt", sort: "desc" }] },
          }}
          slots={{ toolbar: Toolbar }}
          sx={(theme) => ({
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: theme.palette.action.hover,
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
            "& .MuiDataGrid-row:hover": { bgcolor: theme.palette.action.hover },
            "& .MuiDataGrid-cell": {
              borderColor: theme.palette.divider,
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: `1px solid ${theme.palette.divider}`,
            },
          })}
        />
      </Box>

      <UninstallDialog
        plugin={uninstallPlugin}
        onConfirm={handleUninstall}
        onClose={() => setUninstallPlugin(null)}
      />
    </Box>
  );
}
