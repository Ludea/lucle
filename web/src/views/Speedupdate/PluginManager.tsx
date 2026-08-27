import { useState, useCallback, useContext, useEffect, ChangeEvent } from "react";
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
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";

import CircularProgress from "@mui/material/CircularProgress";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  QuickFilter,
  Toolbar as DataGridToolbar,
  FilterPanelTrigger,
  ColumnsPanelTrigger,
} from "@mui/x-data-grid";

import { listPlugins, togglePlugin, removePlugin, installPlugin } from "utils/rpc";
import { LucleRPC } from "context/Luclerpc";
import type { InstalledPlugin as ProtoPlugin } from "gen/lucle_pb";

//Icons
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import StarIcon from "@mui/icons-material/Star";
import DownloadIcon from "@mui/icons-material/Download";

type Category = "ui" | "backend" | "auth" | "devtools" | "gaming" | "theme";

interface InstalledPlugin {
  id: string;
  name: string;
  icon: string;
  author: string;
  version: string;
  category: Category;
  priceType: string;
  description: string;
  tags: string[];
  downloads: number;
  stars: number;
  featured: boolean;
  enabled: boolean;
  installedAt: string;
}

function protoToPlugin(p: ProtoPlugin): InstalledPlugin {
  return {
    id: p.id,
    name: p.name,
    icon: p.icon,
    author: p.author,
    version: p.version,
    category: p.category as Category,
    priceType: p.priceType,
    description: p.description,
    tags: p.tags,
    downloads: p.downloads,
    stars: p.stars,
    featured: p.featured,
    enabled: p.enabled,
    installedAt: new Date(Number(p.installedAt) * 1000).toLocaleDateString(),
  };
}

const CATEGORY_COLOR: Record<
  Category,
  "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success"
> = {
  ui: "info",
  backend: "secondary",
  auth: "error",
  devtools: "warning",
  gaming: "success",
  theme: "primary",
};

const PRICE_LABEL: Record<string, string> = {
  free: "Free",
  paid: "Paid",
  subscription: "Subscription",
};

const CATEGORIES: Category[] = ["ui", "backend", "auth", "devtools", "gaming", "theme"];
const PRICE_TYPES = ["free", "paid", "subscription"];

interface PluginForm {
  id: string;
  name: string;
  icon: string;
  author: string;
  version: string;
  category: Category;
  priceType: string;
  description: string;
  tags: string; // comma-separated input
  downloads: number;
  stars: number;
  featured: boolean;
}

const EMPTY_FORM: PluginForm = {
  id: "",
  name: "",
  icon: "",
  author: "",
  version: "",
  category: "backend",
  priceType: "free",
  description: "",
  tags: "",
  downloads: 0,
  stars: 0,
  featured: false,
};

function AddPluginDialog({
  open,
  onClose,
  onAdded,
  client,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (plugin: ProtoPlugin) => void;
  client: unknown;
}) {
  const [form, setForm] = useState<PluginForm>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setForm(EMPTY_FORM);
    setFile(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function set<K extends keyof PluginForm>(field: K, value: PluginForm[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    if (picked && !picked.name.endsWith(".wasm")) {
      setError("Only .wasm files are accepted");
      return;
    }
    setFile(picked);
    setError(null);
    // Pre-fill id from filename if empty
    if (picked && !form.id) {
      set("id", picked.name.replace(/\.wasm$/, ""));
    }
  }

  function validate(): string | null {
    if (!file) return "Please select a .wasm file";
    if (!form.id.trim()) return "ID is required";
    if (!form.name.trim()) return "Name is required";
    if (!form.version.trim()) return "Version is required";
    if (!form.author.trim()) return "Author is required";
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError(null);

    installPlugin(client, {
      id: form.id.trim(),
      name: form.name.trim(),
      icon: form.icon.trim() || "🔌",
      author: form.author.trim(),
      version: form.version.trim(),
      category: form.category,
      priceType: form.priceType,
      description: form.description.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      downloads: form.downloads,
      stars: form.stars,
      featured: form.featured,
    })
      .then((plugin) => {
        onAdded(plugin);
        handleClose();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <UploadFileIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Add plugin
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {/* WASM file */}
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            color={file ? "success" : "primary"}
            fullWidth
          >
            {file ? file.name : "Select .wasm file"}
            <input type="file" accept=".wasm" hidden onChange={handleFile} />
          </Button>
          <Stack direction="row" spacing={2}>
            <TextField
              label="ID"
              size="small"
              fullWidth
              required
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              placeholder="my-plugin"
            />
            <TextField
              label="Icon (emoji)"
              size="small"
              sx={{ width: 120 }}
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
              placeholder="🔌"
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Name"
              size="small"
              fullWidth
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <TextField
              label="Version"
              size="small"
              sx={{ width: 140 }}
              required
              value={form.version}
              onChange={(e) => set("version", e.target.value)}
              placeholder="0.1.0"
            />
          </Stack>
          <TextField
            label="Author"
            size="small"
            fullWidth
            required
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
          />
          <TextField
            label="Description"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <Stack direction="row" spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => set("category", e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>License</InputLabel>
              <Select
                label="License"
                value={form.priceType}
                onChange={(e) => set("priceType", e.target.value)}
              >
                {PRICE_TYPES.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <TextField
            label="Tags (comma-separated)"
            size="small"
            fullWidth
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="wasm, grpc, auth"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} variant="outlined" size="small" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
        >
          {loading ? "Adding…" : "Add plugin"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <WarningAmberIcon color="warning" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Uninstall plugin
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
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
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          size="small"
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineIcon />
          }
        >
          {loading ? "Removing…" : "Uninstall"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Toolbar() {
  return (
    <DataGridToolbar>
      <QuickFilter />
      <FilterPanelTrigger />
      <ColumnsPanelTrigger />
    </DataGridToolbar>
  );
}

export default function PluginManager() {
  const lucleClient = useContext(LucleRPC);
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uninstallPlugin, setUninstallPlugin] = useState<InstalledPlugin | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const handleAdded = useCallback((proto: ProtoPlugin) => {
    setPlugins((prev) => [protoToPlugin(proto), ...prev]);
  }, []);

  useEffect(() => {
    listPlugins(lucleClient)
      .then((rows) => setPlugins(rows.map(protoToPlugin)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [lucleClient]);

  const handleToggle = useCallback(
    (id: string) => {
      togglePlugin(lucleClient, id)
        .then((updated) =>
          setPlugins((prev) => prev.map((p) => (p.id === id ? protoToPlugin(updated) : p))),
        )
        .catch((e: Error) => setError(e.message));
    },
    [lucleClient],
  );

  const handleUninstall = useCallback(
    (id: string) => {
      return removePlugin(lucleClient, id).then(() =>
        setPlugins((prev) => prev.filter((p) => p.id !== id)),
      );
    },
    [lucleClient],
  );

  const columns: GridColDef<InstalledPlugin>[] = [
    {
      field: "name",
      headerName: "Plugin",
      flex: 1.8,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<InstalledPlugin>) => (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", py: 0.5 }}>
          <Avatar
            sx={(theme) => ({
              width: 30,
              height: 30,
              fontSize: "0.95rem",
              bgcolor: theme.palette.action.hover,
              border: `1px solid ${theme.palette.divider}`,
              flexShrink: 0,
            })}
          >
            {params.row.icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {params.row.name}
              </Typography>
              {params.row.featured && (
                <Chip
                  label="Featured"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 16, fontSize: "0.6rem" }}
                />
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
        <Chip
          label={params.value}
          size="small"
          color={CATEGORY_COLOR[params.value as Category]}
          variant="filled"
          sx={{ height: 20, fontSize: "0.65rem" }}
        />
      ),
    },
    {
      field: "priceType",
      headerName: "License",
      width: 110,
      renderCell: (params: GridRenderCellParams<InstalledPlugin>) => (
        <Chip
          label={PRICE_LABEL[params.row.priceType] ?? params.row.priceType}
          size="small"
          variant="outlined"
          color={params.row.priceType === "free" ? "default" : "warning"}
          sx={{ height: 20, fontSize: "0.65rem" }}
        />
      ),
    },
    {
      field: "downloads",
      headerName: "Downloads",
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.4} sx={{ alignItems: "center" }}>
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
        <Stack direction="row" spacing={0.4} sx={{ alignItems: "center" }}>
          <StarIcon sx={{ fontSize: 13, color: "warning.main" }} />
          <Typography variant="caption" color="text.secondary">
            {params.value}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "installedAt",
      headerName: "Installed",
      width: 110,
      renderCell: (params) => (
        <Typography variant="caption" color="text.secondary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: "enabled",
      headerName: "Status",
      width: 130,
      renderCell: (params: GridRenderCellParams<InstalledPlugin>) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Switch
            size="small"
            checked={params.row.enabled}
            onChange={() => handleToggle(params.row.id)}
            color="success"
          />
          <Stack direction="row" spacing={0.4} sx={{ alignItems: "center" }}>
            <FiberManualRecordIcon
              sx={{
                fontSize: 8,
                color: params.row.enabled ? "success.main" : "text.disabled",
              }}
            />
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
          <IconButton size="small" color="error" onClick={() => setUninstallPlugin(params.row)}>
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
        spacing={1}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            Installed Plugins
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {plugins.length} installed · {activeCount} active
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddOpen(true)}
          >
            Add plugin
          </Button>
          <Button variant="outlined" size="small" startIcon={<StorefrontIcon />} href="/plugins">
            Browse store
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: "hidden",
        })}
      >
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
          slotProps={{ toolbar: { sx: { px: 2, py: 1, gap: 1 } } }}
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

      <AddPluginDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={handleAdded}
        client={lucleClient}
      />
      <UninstallDialog
        plugin={uninstallPlugin}
        onConfirm={handleUninstall}
        onClose={() => setUninstallPlugin(null)}
      />
    </Box>
  );
}
