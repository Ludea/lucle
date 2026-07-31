import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useInView } from 'utils/hook';
import Section from 'components/Section';
import SectionLabel from 'components/SectionLabel';


const FEATURES = [
  { icon: '⬡', title: 'Plugin system, front & back', body: 'Every part of the launcher is extensible. Drop in WebAssembly plugins that run server-side via wasmtime, and load frontend micro-apps dynamically with Module Federation — no rebuild required.' },
  { icon: '📱', title: 'Desktop & mobile', body: 'Built on Tauri v2, Sparus runs natively on Windows, macOS, Linux, Android, and iOS. One codebase, every platform your players use.' },
  { icon: '⟳', title: 'Smart version management', body: 'Delta updates, rollback support, and separate versioning tracks for your game and the launcher itself. Players always launch the right build, automatically.' },
  { icon: '⚡', title: 'gRPC streaming backend', body: 'The CMS backend (Rust + tonic) streams real-time update progress and events to the launcher over HTTP/2. Efficient, typed, and ready to scale.' },
  { icon: '🦀', title: 'Rust-first performance', body: 'A minimal memory footprint and near-instant startup. Sparus stays out of the way until your players need it.' },
  { icon: '◈', title: 'Open source', body: 'MIT licensed. Fork it, self-host the backend, build your own plugins. Sparus is infrastructure you control.' },
];

function Features() {
  const [ref, visible] = useInView();
  return (
    <Section id="features">
      <Box ref={ref}>
        <SectionLabel>Features</SectionLabel>
        <Typography variant="h2" sx={{ fontSize: 'clamp(30px, 4vw, 44px)', mb: 7, maxWidth: 560 }}>
          Everything a game launcher needs, and nothing it doesn't
        </Typography>
        <Grid container spacing={2.5}>
          {FEATURES.map((f, i) => (
            <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{
                height: '100%',
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(24px)',
                transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`,
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography fontSize={28} mb={2}>{f.icon}</Typography>
                  <Typography variant="h3" fontSize={17} mb={1.25}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.body}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Section>
  );
}

export default Features;
