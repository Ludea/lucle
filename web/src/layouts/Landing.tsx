import { useEffect, useState, useMemo, ReactNode } from "react";

import Divider from "@mui/material/Divider";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { buildTheme, DEFAULT_LAYOUT, LayoutContext, ApiTheme } from "context/Theme";
import AppBar from "components/AppBar";
import Hero from "components/Hero";
import Features from "components/Features";
import Showcase from "components/Showcase";
import Highlights from "components/Highlights";
import Footer from "components/Footer";
import Download from "components/Download";

function SparusThemeProvider({ children }: { children: ReactNode }) {
  const [apiTheme, setApiTheme] = useState<ApiTheme>({});
  const [layout, setLayout] = useState<LayoutTokens>(DEFAULT_LAYOUT);

  useEffect(() => {
    fetch("/api/theme")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<ApiTheme>;
      })
      .then((data) => {
        setApiTheme(data);
        if (data.layout) setLayout((prev) => ({ ...prev, ...data.layout }));
      })
      .catch(() => {});
  }, []);

  const theme = useMemo(() => buildTheme(apiTheme), [apiTheme]);

  return (
    <LayoutContext.Provider value={layout}>
      <ThemeProvider theme={theme} disableTransitionOnChange>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </LayoutContext.Provider>
  );
}

export default function Landing() {
  return (
    <SparusThemeProvider>
      <AppBar />
      <main>
        <Hero />
        <Divider />
        <Download />
        <Divider />
        <Features />
        <Divider />
        <Showcase />
        <Divider />
        <Highlights />
        <Divider />
      </main>
      <Footer />
    </SparusThemeProvider>
  );
}
