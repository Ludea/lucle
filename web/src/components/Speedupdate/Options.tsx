import { useContext } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import StorageIcon from "@mui/icons-material/Storage";
import TagIcon from "@mui/icons-material/Tag";
import { Platforms } from "gen/speedupdate_pb";

function formatSize(total: number): string {
  if (total < 1024)       return `${total} B`;
  if (total < 1024 ** 2)  return `${(total / 1024).toFixed(1)} kB`;
  if (total < 1024 ** 3)  return `${(total / 1024 ** 2).toFixed(1)} MB`;
  if (total < 1024 ** 4)  return `${(total / 1024 ** 3).toFixed(1)} GB`;
  return `${(total / 1024 ** 4).toFixed(1)} TB`;
}

const SectionCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: `calc(${theme.shape.borderRadius}px * 2)`,
  padding: theme.spacing(2.5),
  width: "100%",
  marginBottom: theme.spacing(2),
}));

const SectionLabel = styled(Typography)(({ theme }) => ({
  fontFamily: "JetBrains Mono, monospace",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const StatRow = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.action.hover,
  border: `1px solid ${theme.palette.divider}`,
}));

interface SpeedupdateOptionsProps {
  binaryType:       "game" | "launcher";
  currentRepo:      Map<string, string[]>;
  setCurrentRepo:   (repo: Map<string, string[]>) => void;
  setPlatformsEnum: (platforms: Platforms[]) => void;
  currentVer:       string;
  size:             number | undefined;
  error:            string | null;
  setError:         (err: string | null) => void;
}

function SpeedupdateOptions({
  binaryType,
  currentVer,
  size,
  error,
  setError,
}: SpeedupdateOptionsProps) {
  return (
    <SectionCard>
      <SectionLabel sx={{ mb: 2 }}>// {binaryType} options</SectionLabel>

      <Grid container spacing={1.5} mb={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatRow direction="row" alignItems="center" spacing={1}>
            <TagIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Current version
              </Typography>
              <Typography variant="body2" fontWeight={600}
                sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                {currentVer || "—"}
              </Typography>
            </Box>
          </StatRow>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatRow direction="row" alignItems="center" spacing={1}>
            <StorageIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Packages size
              </Typography>
              <Typography variant="body2" fontWeight={600}
                sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                {size !== undefined ? formatSize(size) : "—"}
              </Typography>
            </Box>
          </StatRow>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2.5 }}>
        <Chip label="Paths" size="small" variant="outlined"
          sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem" }} />
      </Divider>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField id="build-path" label="Build path" size="small" fullWidth
            slotProps={{
              input: { startAdornment: <FolderOpenIcon sx={{ fontSize: 16, mr: 0.5, color: "text.disabled" }} /> },
              htmlInput: { style: { fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem" } },
            }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField id="upload-path" label="Upload path" size="small" fullWidth
            slotProps={{
              input: { startAdornment: <CloudUploadIcon sx={{ fontSize: 16, mr: 0.5, color: "text.disabled" }} /> },
              htmlInput: { style: { fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem" } },
            }} />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </SectionCard>
  );
}

export default SpeedupdateOptions;
