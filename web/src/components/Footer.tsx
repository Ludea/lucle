import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLayout, useIsMobile } from "utils/hook";

const GITHUB_URL = "https://github.com/Ludea/Sparus";

function SparusIcon() {
  const theme = useTheme();
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect
        width="28"
        height="28"
        rx={theme.shape.borderRadius}
        fill={theme.palette.primary.dark}
      />
      <polygon
        points="14,6 22,10 22,18 14,22 6,18 6,10"
        fill="none"
        stroke={theme.palette.primary.main}
        strokeWidth="1.5"
      />
      <circle cx="14" cy="14" r="3" fill={theme.palette.primary.main} />
    </svg>
  );
}

function Footer() {
  const layout = useLayout();
  const isMobile = useIsMobile();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        px: `${isMobile ? layout.mobilePadding : layout.desktopPadding}px`,
        py: 5,
        maxWidth: layout.maxWidth,
        mx: "auto",
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between"', alignItems: "center", flexWrap: "wrap", gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.25}>
          <SparusIcon />
          <Typography variant="h6" sx={{ fontSize: 16 }}>
            Sparus
          </Typography>
          <Typography variant="body2" color="text.secondary">
            — MIT License
          </Typography>
        </Stack>
        <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
          <Typography
            component="a"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            color="text.secondary"
            sx={{
              textDecoration: "none",
              "&:hover": { color: "text.primary" },
              transition: "color 0.2s",
            }}
          >
            GitHub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Sparus contributors
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export default Footer;
