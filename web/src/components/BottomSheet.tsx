import { useColorScheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import GitHubIcon from "@mui/icons-material/GitHub";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

const GITHUB_URL = "https://github.com/Ludea/Sparus";

const NAV_LINKS = [
  { label: "Download", href: "#download" },
  { label: "Features", href: "#features" },
  { label: "Showcase", href: "#showcase" },
  { label: "Highlights", href: "#highlights" },
  { label: "Blog", href: "/blog" },
];

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function BottomSheet({ open, onClose }: BottomSheetProps) {
  const { mode, setMode } = useColorScheme();
  const isDark = mode === "dark";

  const toggleMode = () => {
    setMode(isDark ? "light" : "dark");
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxHeight: "85vh" } }}
    >
      {/* Handle */}
      <Box
        sx={{
          width: 36,
          height: 4,
          borderRadius: 1,
          bgcolor: "divider",
          mx: "auto",
          mt: 1.5,
          mb: 3.5,
        }}
      />

      <List disablePadding sx={{ px: 2 }}>
        {NAV_LINKS.map(({ label, href }) => (
          <ListItem key={href} disablePadding divider>
            <ListItemButton
              component="a"
              href={href}
              onClick={onClose}
              sx={{ py: 1.5, borderRadius: 1 }}
            >
              <ListItemText
                primary={label}
                primaryTypographyProps={{ variant: "h6", fontSize: 18 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Stack spacing={1.5} sx={{ px: 3, py: 3 }}>
        <Button
          component="a"
          href="/login"
          onClick={onClose}
          variant="outlined"
          fullWidth
          startIcon={<PersonOutlinedIcon />}
          sx={{ py: 1.5 }}
        >
          Sign in
        </Button>
        <Button
          component="a"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          variant="contained"
          fullWidth
          startIcon={<GitHubIcon />}
          sx={{ py: 1.5 }}
        >
          View on GitHub
        </Button>
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
          <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton onClick={toggleMode} color="inherit">
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
    </Drawer>
  );
}
