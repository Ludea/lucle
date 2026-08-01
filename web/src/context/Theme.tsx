import { ReactNode, createContext, useState, useMemo, useEffect } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export interface LayoutTokens {
  maxWidth: number;
  navHeight: number;
  mobilePadding: number;
  desktopPadding: number;
  mobileBreakpoint: number;
  sectionPadding: number;
}

export const DEFAULT_LAYOUT: LayoutTokens = {
  maxWidth: 1200,
  navHeight: 64,
  mobilePadding: 24,
  desktopPadding: 40,
  mobileBreakpoint: 768,
  sectionPadding: 100,
};

export const LayoutContext = createContext<LayoutTokens>(DEFAULT_LAYOUT);

export interface ApiTheme {
  palette?: {
    primary?: { main?: string; dark?: string };
    success?: { main?: string };
    background?: { default?: string; paper?: string };
    divider?: string;
    text?: { primary?: string; secondary?: string };
  };
  shape?: { borderRadius?: number };
  spacing?: number;
  typography?: {
    fontFamily?: string;
    fontFamilyDisplay?: string;
  };
  layout?: Partial<LayoutTokens>;
}

export function buildTheme(api: ApiTheme) {
  const primaryMain = api.palette?.primary?.main ?? "#5B8CFF";
  const primaryDark = api.palette?.primary?.dark ?? "#2A3F7A";
  const successMain = api.palette?.success?.main ?? "#3DD68C";
  const borderRadius = api.shape?.borderRadius ?? 8;
  const spacingUnit = api.spacing ?? 8;
  const displayFont = api.typography?.fontFamilyDisplay ?? "'Space Grotesk', sans-serif";
  const bodyFont = api.typography?.fontFamily ?? "'Inter', sans-serif";

  return createTheme({
    cssVariables: {
      colorSchemeSelector: "data-mui-color-scheme",
      cssVarPrefix: "sparus",
      disableCssColorScheme: false,
    },
    defaultColorScheme: "dark",
    colorSchemes: {
      dark: {
        palette: {
          primary: { main: primaryMain, dark: primaryDark },
          success: { main: successMain },
          background: {
            default: api.palette?.background?.default ?? "#0D0F14",
            paper: api.palette?.background?.paper ?? "#161A24",
          },
          divider: api.palette?.divider ?? "#1E2535",
          text: {
            primary: api.palette?.text?.primary ?? "#E8ECF4",
            secondary: api.palette?.text?.secondary ?? "#7A85A0",
          },
        },
      },
      light: {
        palette: {
          primary: { main: primaryMain, dark: primaryDark },
          success: { main: successMain },
          background: { default: "#F5F7FA", paper: "#FFFFFF" },
          divider: "#E0E4ED",
          text: { primary: "#0D0F14", secondary: "#5A6478" },
        },
      },
    },
    shape: { borderRadius },
    spacing: spacingUnit,
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: displayFont, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em" },
      h2: { fontFamily: displayFont, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.025em" },
      h3: { fontFamily: displayFont, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.01em" },
      h6: { fontFamily: displayFont, fontWeight: 600 },
      overline: {
        fontFamily: displayFont,
        fontWeight: 700,
        letterSpacing: "0.1em",
        fontSize: "0.72rem",
      },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.65 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none !important",
            backgroundColor: "transparent !important",
            boxShadow: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius },
          containedPrimary: {
            "&:hover": { opacity: 0.88, transform: "translateY(-1px)" },
            transition: "opacity 0.2s, transform 0.2s",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            backgroundImage: "none",
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: borderRadius * 2.5 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 500, minHeight: 36 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: `${borderRadius * 2.5}px ${borderRadius * 2.5}px 0 0`,
            background: theme.palette.background.paper,
          }),
        },
      },
    },
  });
}
