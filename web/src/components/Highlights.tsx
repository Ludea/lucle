import { useTheme } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useInView } from "utils/hook";
import Section from "components/Section";
import SectionLabel from "components/SectionLabel";

function Highlights() {
  const [ref, visible] = useInView();
  const theme = useTheme();

  const HIGHLIGHTS = [
    {
      tag: "Plugin architecture",
      title: "Extend anything",
      accent: theme.palette.primary.main,
      body: "Sparus exposes both its frontend shell and its Rust backend as plugin surfaces. Ship a new game mode, a custom update screen, or a backend service — without touching the core launcher. WASM on the server side, Module Federation on the client.",
    },
    {
      tag: "Cross-platform",
      title: "Your players are everywhere",
      accent: "#A78BFF",
      body: "From Steam Deck to iPhone, Sparus is built on Tauri v2 to run natively on every major platform. One distribution pipeline, consistent behavior, no Electron overhead.",
    },
    {
      tag: "Version control",
      title: "Ship updates, not headaches",
      accent: theme.palette.success.main,
      body: "Independent version tracks for the launcher and the game, delta patch delivery, and rollback support built in. Players get the right version, every time, with minimal download size.",
    },
  ];

  return (
    <Section id="highlights">
      <SectionLabel>Why Sparus</SectionLabel>
      <Typography variant="h2" sx={{ fontSize: "clamp(30px, 4vw, 44px)", mb: 7, maxWidth: 520 }}>
        Built for studios that ship games, not launchers
      </Typography>
      <Grid container spacing={3} ref={ref}>
        {HIGHLIGHTS.map((h, i) => (
          <Grid key={h.tag} size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                height: "100%",
                borderTop: `3px solid ${h.accent}`,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(24px)",
                transition: `opacity 0.55s ease ${i * 100}ms, transform 0.55s ease ${i * 100}ms`,
              }}
            >
              <CardContent sx={{ p: 5 }}>
                <Typography variant="overline" sx={{ display: "block", color: h.accent, mb: 2 }}>
                  {h.tag}
                </Typography>
                <Typography variant="h2" sx={{ fontSize: 24, mb: 1.75 }}>
                  {h.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {h.body}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}

export default Highlights;
