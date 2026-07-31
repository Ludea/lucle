import { useState, useEffect } from "react";

import { useTheme, useColorScheme } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import BottomSheet from "components/BottomSheet";

import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode'
import GitHubIcon from '@mui/icons-material/GitHub';
import MenuIcon from '@mui/icons-material/Menu';

import { useLayout, useIsMobile } from "utils/hook";

function SparusIcon() {
  const theme = useTheme();
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx={theme.shape.borderRadius} fill={theme.palette.primary.dark} />
      <polygon points="14,6 22,10 22,18 14,22 6,18 6,10"
        fill="none" stroke={theme.palette.primary.main} strokeWidth="1.5" />
      <circle cx="14" cy="14" r="3" fill={theme.palette.primary.main} />
    </svg>
  );
}

const GITHUB_URL = 'https://github.com/Ludea/Sparus';

const NAV_LINKS = [
  { label: 'Download',   href: '#download' },
  { label: 'Features',   href: '#features' },
  { label: 'Showcase',   href: '#showcase' },
  { label: 'Highlights', href: '#highlights' },
  { label: 'Blog',       href: '/blog' },
];

function AppBar() {

  const layout = useLayout();
  const isMobile = useIsMobile();
  const { mode, setMode } = useColorScheme();
  const [scrolled, setScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDark = mode === 'dark';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const px = isMobile ? layout.mobilePadding : layout.desktopPadding;

  return (
    <>
      <MuiAppBar
        position="fixed"
        elevation={0}
        style={{
          backgroundColor: scrolled
            ? 'var(--sparus-palette-background-default)'
            : 'transparent',
        }}
        sx={{
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid' : '1px solid transparent',
          borderColor: scrolled ? 'divider' : 'transparent',
          transition: 'all 0.3s ease',
          color: 'text.primary',
        }}
      >
        <Toolbar
          sx={{
            maxWidth: layout.maxWidth,
            width: '100%',
            mx: 'auto',
            px: `${px}px !important`,
            minHeight: `${layout.navHeight}px !important`,
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.25}>
            <SparusIcon />
            <Typography variant="h6" sx={{ letterSpacing: '-0.02em' }}>Sparus</Typography>
          </Stack>

          {/* Desktop nav */}
          {!isMobile && (
            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={0.5}>
              {NAV_LINKS.map(({ label, href }) => (
                <Button key={href} component="a" href={href} color="inherit"
                  sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {label}
                </Button>
              ))}
              <Button
                component="a" href="/login" color="inherit"
                startIcon={<PersonOutlinedIcon fontSize="small" />}
                sx={{ color: 'text.secondary', fontWeight: 500 }}
              >
                Sign in
              </Button>
              <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
                <IconButton
                  onClick={() => setMode(isDark ? 'light' : 'dark')}
                  color="inherit" size="small" sx={{ mx: 0.5 }}
                >
                  {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Button
                component="a" href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
                variant="outlined" color="inherit"
                startIcon={<GitHubIcon fontSize="small" />}
                sx={{ borderColor: 'divider', ml: 0.5 }}
              >
                GitHub
              </Button>
            </Stack>
          )}

          {/* Mobile burger */}
          {isMobile && (
            <IconButton onClick={() => setSheetOpen(true)} color="inherit">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </MuiAppBar>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

export default AppBar;
