import { useState, useMemo, useEffect, ReactNode } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";

//Icons
import SearchIcon from "@mui/icons-material/Search";
import DownloadDoneIcon from "@mui/icons-material/DownloadDone";
import DownloadIcon from "@mui/icons-material/Download";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LockIcon from "@mui/icons-material/Lock";
import StarIcon from "@mui/icons-material/Star";
import ExtensionIcon from "@mui/icons-material/Extension";
import PaletteIcon from "@mui/icons-material/Palette";
import StorageIcon from "@mui/icons-material/Storage";
import SecurityIcon from "@mui/icons-material/Security";
import BuildIcon from "@mui/icons-material/Build";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";

import CheckoutDialog from "components/Speedupdate/CheckoutDialog";

import { listPlugins, installPlugin, removePlugin } from "utils/rpc";
import type { InstalledPlugin as ProtoPlugin } from "gen/lucle_pb";

type Category = "all" | "ui" | "backend" | "auth" | "devtools" | "gaming" | "theme";

type PriceModel =
  | { type: "free" }
  | { type: "paid"; amount: number; currency: string }
  | { type: "subscription"; monthly: number; yearly: number; currency: string };

interface StorePlugin {
  id: string;
  name: string;
  icon: string;
  author: string;
  version: string;
  category: Exclude<Category, "all">;
  priceType: string;
  price: PriceModel;
  description: string;
  tags: string[];
  downloads: number;
  stars: number;
  featured: boolean;
  enabled: boolean;
  installed: boolean;
  installing: boolean;
  purchased: boolean;
}

// ─── Proto → StorePlugin ──────────────────────────────────────────────────────
// price is not stored in the DB (it comes from the payment system),
// so we derive it from price_type with zero amounts — adapt when you have
// a price field in the table.

function protoToStore(p: ProtoPlugin): StorePlugin {
  const price: PriceModel =
    p.priceType === "paid"
      ? { type: "paid", amount: 0, currency: "USD" }
      : p.priceType === "subscription"
        ? { type: "subscription", monthly: 0, yearly: 0, currency: "USD" }
        : { type: "free" };

  return {
    id: p.id,
    name: p.name,
    icon: p.icon,
    author: p.author,
    version: p.version,
    category: p.category as Exclude<Category, "all">,
    priceType: p.priceType,
    price,
    description: p.description,
    tags: p.tags,
    downloads: p.downloads,
    stars: p.stars,
    featured: p.featured,
    enabled: p.enabled,
    installed: true, // rows from the DB are by definition installed
    installing: false,
    purchased: p.priceType !== "free",
  };
}

const CATEGORIES: { value: Category; label: string; icon: ReactNode }[] = [
  { value: "all", label: "All", icon: <ExtensionIcon fontSize="small" /> },
  { value: "ui", label: "UI", icon: <PaletteIcon fontSize="small" /> },
  { value: "backend", label: "Backend", icon: <StorageIcon fontSize="small" /> },
  { value: "auth", label: "Auth", icon: <SecurityIcon fontSize="small" /> },
  { value: "devtools", label: "DevTools", icon: <BuildIcon fontSize="small" /> },
  { value: "gaming", label: "Gaming", icon: <SportsEsportsIcon fontSize="small" /> },
  { value: "theme", label: "Theme", icon: <PaletteIcon fontSize="small" /> },
];

const CATEGORY_COLOR: Record<
  Exclude<Category, "all">,
  "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success"
> = {
  ui: "info",
  backend: "secondary",
  auth: "error",
  devtools: "warning",
  gaming: "success",
  theme: "primary",
};

function fmtDownloads(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function canInstall(plugin: StorePlugin): boolean {
  return plugin.price.type === "free" || plugin.purchased;
}

function PriceBadge({ plugin }: { plugin: StorePlugin }) {
  if (plugin.price.type === "free") {
    return (
      <Chip
        label="Free"
        size="small"
        color="success"
        variant="outlined"
        sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
      />
    );
  }
  if (plugin.purchased) {
    return (
      <Chip
        label="Purchased"
        size="small"
        color="success"
        variant="filled"
        sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
      />
    );
  }
  return (
    <Chip
      label={plugin.priceType}
      size="small"
      color="warning"
      variant="filled"
      sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
    />
  );
}

function ActionButton({
  plugin,
  onToggle,
  onBuy,
}: {
  plugin: StorePlugin;
  onToggle: (id: string) => void;
  onBuy: (id: string) => void;
}) {
  if (plugin.installed) {
    return (
      <Button
        size="small"
        variant="outlined"
        color="error"
        startIcon={<DownloadDoneIcon />}
        onClick={() => onToggle(plugin.id)}
        sx={{ minWidth: 100, fontSize: "0.72rem" }}
      >
        Uninstall
      </Button>
    );
  }
  if (plugin.installing) {
    return (
      <Button size="small" variant="contained" disabled sx={{ minWidth: 100, fontSize: "0.72rem" }}>
        Installing…
      </Button>
    );
  }
  if (!canInstall(plugin)) {
    return (
      <Button
        size="small"
        variant="contained"
        color="warning"
        startIcon={<ShoppingCartIcon />}
        onClick={() => onBuy(plugin.id)}
        sx={{ minWidth: 100, fontSize: "0.72rem" }}
      >
        {plugin.priceType}
      </Button>
    );
  }
  return (
    <Button
      size="small"
      variant="contained"
      color="primary"
      startIcon={<DownloadIcon />}
      onClick={() => onToggle(plugin.id)}
      sx={{ minWidth: 100, fontSize: "0.72rem" }}
    >
      Install
    </Button>
  );
}

function PluginCard({
  plugin,
  onToggle,
  onBuy,
}: {
  plugin: StorePlugin;
  onToggle: (id: string) => void;
  onBuy: (id: string) => void;
}) {
  const locked = !canInstall(plugin) && !plugin.installed;

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "border-color 0.2s, box-shadow 0.2s",
        borderColor: plugin.installed ? "success.dark" : locked ? "warning.dark" : "divider",
        boxShadow: plugin.installed
          ? `0 0 0 1px ${theme.palette.success.dark}22, 0 2px 12px ${theme.palette.success.dark}18`
          : locked
            ? `0 0 0 1px ${theme.palette.warning.dark}18`
            : undefined,
        "&:hover": {
          borderColor: plugin.installed ? "success.main" : locked ? "warning.main" : "primary.main",
        },
        "&::before": plugin.installed
          ? {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, transparent, ${theme.palette.success.main}, transparent)`,
              borderRadius: "4px 4px 0 0",
            }
          : undefined,
      })}
    >
      {plugin.installing && (
        <LinearProgress
          color="primary"
          sx={{ position: "absolute", top: 0, left: 0, right: 0, borderRadius: "4px 4px 0 0" }}
        />
      )}

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", mb: 1.5 }} spacing={1.5}>
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              sx={(theme) => ({
                width: 40,
                height: 40,
                fontSize: "1.3rem",
                bgcolor: theme.palette.action.hover,
                border: `1px solid ${theme.palette.divider}`,
                filter: locked ? "grayscale(60%)" : undefined,
                opacity: locked ? 0.8 : 1,
              })}
            >
              {plugin.icon}
            </Avatar>
            {locked && (
              <Box
                sx={(theme) => ({
                  position: "absolute",
                  bottom: -3,
                  right: -3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  bgcolor: "warning.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${theme.palette.background.paper}`,
                })}
              >
                <LockIcon sx={{ fontSize: 9, color: "warning.contrastText" }} />
              </Box>
            )}
          </Box>

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap" }} spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                {plugin.name}
              </Typography>
              {plugin.featured && (
                <Chip
                  label="Featured"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 16, fontSize: "0.6rem", px: 0.5 }}
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              by {plugin.author} · v{plugin.version}
            </Typography>
          </Box>

          <Chip
            label={plugin.category}
            size="small"
            color={CATEGORY_COLOR[plugin.category]}
            variant="filled"
            sx={{ height: 20, fontSize: "0.65rem", flexShrink: 0 }}
          />
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.55,
            mb: 1.5,
          }}
        >
          {plugin.description}
        </Typography>

        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
          {plugin.tags.map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              size="small"
              variant="outlined"
              sx={{
                height: 18,
                fontSize: "0.6rem",
                color: "text.disabled",
                borderColor: "divider",
              }}
            />
          ))}
        </Stack>
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 2, py: 1, justifyContent: "space-between" }}>
        <Stack direction="row" sx={{ spacing: 1.5, alignItems: "center" }}>
          <Tooltip title="Downloads">
            <Stack direction="row" sx={{ alignItems: "center" }} spacing={0.4}>
              <DownloadIcon sx={{ fontSize: 13, color: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary">
                {fmtDownloads(plugin.downloads)}
              </Typography>
            </Stack>
          </Tooltip>
          <Tooltip title="Stars">
            <Stack direction="row" sx={{ alignItems: "center" }} spacing={0.4}>
              <StarIcon sx={{ fontSize: 13, color: "warning.main" }} />
              <Typography variant="caption" color="text.secondary">
                {plugin.stars}
              </Typography>
            </Stack>
          </Tooltip>
          <PriceBadge plugin={plugin} />
        </Stack>
        <ActionButton plugin={plugin} onToggle={onToggle} onBuy={onBuy} />
      </CardActions>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card variant="outlined" sx={{ height: 220 }}>
      <CardContent>
        <Stack direction="row" sx={{ spacing: 1.5, mb: 1.5 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Box>
        </Stack>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </CardContent>
    </Card>
  );
}

export default function PluginStore() {
  const [plugins, setPlugins] = useState<StorePlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [checkoutPlugin, setCheckoutPlugin] = useState<StorePlugin | null>(null);

  useEffect(() => {
    listPlugins()
      .then((rows) => setPlugins(rows.map(protoToStore)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return plugins.filter((p) => {
      const matchCat = category === "all" || p.category === category;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.author.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [plugins, search, category]);

  const installedCount = plugins.filter((p) => p.installed).length;

  function handleToggle(id: string) {
    const plugin = plugins.find((p) => p.id === id);
    if (!plugin) return;

    if (plugin.installed) {
      removePlugin(id)
        .then(() =>
          setPlugins((prev) => prev.map((p) => (p.id !== id ? p : { ...p, installed: false }))),
        )
        .catch((e: Error) => setError(e.message));
    } else {
      setPlugins((prev) => prev.map((p) => (p.id !== id ? p : { ...p, installing: true })));
      installPlugin({
        id: plugin.id,
        name: plugin.name,
        icon: plugin.icon,
        author: plugin.author,
        version: plugin.version,
        category: plugin.category,
        priceType: plugin.priceType,
        description: plugin.description,
        tags: plugin.tags,
        downloads: plugin.downloads,
        stars: plugin.stars,
        featured: plugin.featured,
      })
        .then((proto) =>
          setPlugins((prev) =>
            prev.map((p) =>
              p.id !== id ? p : { ...protoToStore(proto), installed: true, installing: false },
            ),
          ),
        )
        .catch((e: Error) => {
          setPlugins((prev) => prev.map((p) => (p.id !== id ? p : { ...p, installing: false })));
          setError(e.message);
        });
    }
  }

  function handleBuy(id: string) {
    const plugin = plugins.find((p) => p.id === id);
    if (plugin) setCheckoutPlugin(plugin);
  }

  function handleCheckoutSuccess(id: string) {
    setPlugins((prev) => prev.map((p) => (p.id !== id ? p : { ...p, purchased: true })));
    setCheckoutPlugin(null);
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1200 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ alignItems: { sm: "center" }, mb: 3, justifyContent: "space-between" }}
        spacing={1}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            Plugin Store
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {installedCount} installed · {plugins.length} available
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search plugins…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: { xs: "100%", sm: 260 } }}
        />
      </Stack>

      <ToggleButtonGroup
        value={category}
        exclusive
        onChange={(_, v) => v && setCategory(v)}
        size="small"
        sx={{ mb: 3, flexWrap: "wrap", gap: 0.5 }}
      >
        {CATEGORIES.map((c) => (
          <ToggleButton
            key={c.value}
            value={c.value}
            sx={{
              gap: 0.5,
              px: 1.5,
              fontSize: "0.75rem",
              textTransform: "none",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "6px !important",
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderColor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              },
            }}
          >
            {c.icon}
            {c.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
              <CardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, color: "text.disabled" }}>
          <ExtensionIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography variant="body2">No plugins match your search.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((plugin) => (
            <Grid key={plugin.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <PluginCard plugin={plugin} onToggle={handleToggle} onBuy={handleBuy} />
            </Grid>
          ))}
        </Grid>
      )}

      <CheckoutDialog
        open={!!checkoutPlugin}
        plugin={checkoutPlugin}
        onClose={() => setCheckoutPlugin(null)}
        onSuccess={handleCheckoutSuccess}
      />
    </Box>
  );
}
