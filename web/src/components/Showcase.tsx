import { useState } from "react";

import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useInView } from "utils/hook";
import Section from "components/Section";
import SectionLabel from "components/SectionLabel";

const SCREENS = [
  {
    label: "Main launcher",
    desc: "Game library, update status, and one-click launch.",
    icon: "🎮",
  },
  {
    label: "Plugin manager",
    desc: "Browse, enable, and configure frontend & backend plugins at runtime.",
    icon: "⬡",
  },
  {
    label: "Update stream",
    desc: "Live progress fed over gRPC — patches download while you wait.",
    icon: "⟳",
  },
];

function Showcase() {
  const [ref, visible] = useInView();
  const [active, setActive] = useState(0);
  const theme = useTheme();

  return (
    <Section id="showcase">
      <SectionLabel>Showcase</SectionLabel>
      <Typography variant="h2" sx={{ fontSize: "clamp(30px, 4vw, 44px)", mb: 6 }}>
        See it in action
      </Typography>

      <Tabs
        value={active}
        onChange={(_, v) => setActive(v)}
        sx={{ mb: 3, "& .MuiTabs-indicator": { borderRadius: 1 } }}
      >
        {SCREENS.map((s, i) => (
          <Tab key={i} label={s.label} />
        ))}
      </Tabs>

      <Box
        ref={ref}
        sx={{
          width: "100%",
          aspectRatio: "16/9",
          bgcolor: "background.paper",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(32px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${theme.palette.divider} 1px, transparent 1px), linear-gradient(90deg, ${theme.palette.divider} 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            opacity: 0.4,
          }}
        />
        <Stack spacing={1.5} sx={{ alignItems: "center", position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: "primary.dark",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            {SCREENS[active].icon}
          </Box>
          <Typography variant="h6">{SCREENS[active].label}</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", maxWidth: 360 }}
          >
            {SCREENS[active].desc}
          </Typography>
          <Chip
            label="screenshot coming soon"
            size="small"
            variant="outlined"
            sx={{ color: "text.secondary", borderColor: "divider" }}
          />
        </Stack>
      </Box>
    </Section>
  );
}

export default Showcase;
