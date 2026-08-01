import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLayout, useIsMobile } from "utils/hook";

import GitHubIcon from "@mui/icons-material/GitHub";

const GITHUB_URL = "https://github.com/Ludea/Sparus";

function Hero() {
  const layout = useLayout();
  const isMobile = useIsMobile();
  const theme = useTheme();

  return (
    <Box
      component="section"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        pt: `${layout.navHeight + layout.sectionPadding / 2}px`,
        pb: `${layout.sectionPadding}px`,
        px: `${isMobile ? layout.mobilePadding : layout.desktopPadding}px`,
      }}
    >
      <Box sx={{ maxWidth: 720 }}>
        <Chip
          label="Open source · Tauri v2 · WASM"
          size="small"
          variant="outlined"
          icon={
            <Box
              component="span"
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "success.main",
                display: "inline-block",
                ml: "10px !important",
              }}
            />
          }
          sx={{
            mb: 4,
            color: "text.secondary",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        />

        <Typography variant="h1" sx={{ fontSize: "clamp(44px, 7vw, 76px)", mb: 3.5 }}>
          A plugin-first launcher to{" "}
          <Box
            component="span"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, #A78BFF)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            install & update
          </Box>{" "}
          your game
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: 19, maxWidth: 520, mx: "auto", mb: 5.5 }}
        >
          Sparus is a desktop launcher built on Rust and WebAssembly. Extend it with plugins on both
          frontend and backend, ship on desktop and mobile, and let players always run the right
          version.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            component="a"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            size="large"
            startIcon={<GitHubIcon size={18} />}
            sx={{ px: 3.5, py: 1.625 }}
          >
            View on GitHub
          </Button>
          <Button
            component="a"
            href="#features"
            variant="text"
            color="inherit"
            size="large"
            sx={{ color: "text.secondary" }}
          >
            Explore features ↓
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

export default Hero;
