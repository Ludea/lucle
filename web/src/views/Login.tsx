import { useState, useContext, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import Signin from "components/Signin";
import Signup from "components/Signup";
import { createUser } from "utils/rpc";
import { LucleRPC } from "context/Luclerpc";
import { useAuth } from "context/Auth";

// ─── Design tokens ────────────────────────────────────────────────
const ACCENT      = "#6C63FF";
const BG_DARK     = "#0d1117";
const BG_LIGHT    = "#f0f2f8";

type Mode = "light" | "dark";

function buildTheme(mode: Mode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: ACCENT },
      background: {
        default: dark ? BG_DARK : BG_LIGHT,
        paper:   dark ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.7)",
      },
      error: { main: "#ff6b6b" },
      text: {
        primary:   dark ? "#e6edf3"              : "#111318",
        secondary: dark ? "rgba(230,237,243,0.5)" : "rgba(17,19,24,0.5)",
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          body {
            min-height: 100vh;
            background: ${dark ? BG_DARK : BG_LIGHT};
          }
        `,
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            background: dark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.8)",
            borderRadius: 10,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: ACCENT,
              boxShadow: `0 0 0 3px ${alpha(ACCENT, 0.25)}`,
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderColor: "#ff6b6b",
              boxShadow: "0 0 0 3px rgba(255,107,107,0.2)",
            },
          },
          input: { color: dark ? "#e6edf3" : "#111318" },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: dark ? "rgba(230,237,243,0.5)" : "rgba(17,19,24,0.5)",
            "&.Mui-focused": { color: ACCENT },
            "&.Mui-error":   { color: "#ff6b6b" },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            "&:active":      { transform: "scale(0.98)" },
            "&.Mui-disabled": { opacity: 0.38 },
          },
        },
        variants: [
          {
            props: { variant: "contained", color: "primary" },
            style: {
              boxShadow: `0 4px 20px ${alpha(ACCENT, 0.35)}`,
              "&:hover": {
                background: "#8b84ff",
                boxShadow: `0 6px 28px ${alpha(ACCENT, 0.45)}`,
              },
            },
          },
        ],
      },
      MuiFormHelperText: {
        styleOverrides: { root: { marginLeft: 0 } },
      },
    },
  });
}

// ─── Background blobs ─────────────────────────────────────────────
function blobSx(mode: Mode) {
  const dark = mode === "dark";
  return {
    position: "fixed" as const,
    inset: 0,
    pointerEvents: "none" as const,
    zIndex: 0,
    overflow: "hidden",
    "& span": {
      position: "absolute",
      borderRadius: "50%",
      filter: "blur(80px)",
      opacity: dark ? 0.18 : 0.25,
      animation: "floatBlob 12s ease-in-out infinite alternate",
    },
    "& span:first-of-type": {
      width: { xs: 300, sm: 520 },
      height: { xs: 300, sm: 520 },
      background: `radial-gradient(circle, ${ACCENT}, transparent 70%)`,
      top: -120,
      left: -100,
    },
    "& span:last-child": {
      width: { xs: 200, sm: 400 },
      height: { xs: 200, sm: 400 },
      background: "radial-gradient(circle, #00d4ff, transparent 70%)",
      bottom: -80,
      right: -80,
      animationDelay: "-6s",
    },
    "@keyframes floatBlob": {
      from: { transform: "translate(0,0) scale(1)" },
      to:   { transform: "translate(30px,20px) scale(1.06)" },
    },
  };
}

// ─── Minimal TabPanel ─────────────────────────────────────────────
function TabPanel({
  value,
  current,
  children,
}: {
  value: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <Box role="tabpanel" hidden={value !== current} aria-labelledby={`tab-${value}`}>
      {value === current && children}
    </Box>
  );
}

// ─── Component ───────────────────────────────────────────────────
export default function Login() {
  const [tab, setTab]       = useState("1");
  const [error, setError]   = useState<string>("");
  const [successfullSignup, setSuccessfullSignup] = useState<boolean>(false);
  const [mode, setMode]     = useState<Mode>(() => {
    const saved = localStorage.getItem("colorMode");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const auth   = useAuth();
  const client = useContext(LucleRPC);
  const theme  = useMemo(() => buildTheme(mode), [mode]);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      localStorage.setItem("colorMode", next);
      return next;
    });
  }, []);

  const handleSignup = (username: string, password: string, email: string) => {
    setError("");
    createUser(client, username, password, email, "user")
      .then(() => { setSuccessfullSignup(true); })
      .catch((err: unknown) => {
        setError((err as { rawMessage: string }).rawMessage);
      });
  };

  const handleSignin = (username: string, password: string, remember: boolean) => {
    setError("");
    if (remember) {
      localStorage.setItem("username", username);
    } else {
      localStorage.removeItem("username");
    }
    auth.Login({ username, password }).catch((err: unknown) => {
      setError((err as { rawMessage: string }).rawMessage);
    });
  };

  const dark = mode === "dark";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Animated background */}
      <Box sx={blobSx(mode)} aria-hidden="true">
        <span /><span />
      </Box>

      {/* Centered card */}
      <Container
        component="main"
        maxWidth="xs"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: "100%",
            p: { xs: 3, sm: 4.5 },
            borderRadius: 3,
            background: dark ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.72)",
            border: dark
              ? "1px solid rgba(255,255,255,0.09)"
              : "1px solid rgba(0,0,0,0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: dark
              ? [
                  "0 0 0 0.5px rgba(255,255,255,0.06) inset",
                  "0 32px 64px rgba(0,0,0,0.5)",
                  `0 0 80px ${alpha(ACCENT, 0.2)}`,
                ].join(",")
              : [
                  "0 0 0 0.5px rgba(0,0,0,0.04) inset",
                  "0 16px 48px rgba(0,0,0,0.1)",
                  `0 0 60px ${alpha(ACCENT, 0.1)}`,
                ].join(","),
          }}
        >
          {/* Brand + theme toggle */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 3.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
              <Box
                sx={{
                  width: 9, height: 9,
                  borderRadius: "50%",
                  bgcolor: ACCENT,
                  boxShadow: `0 0 10px ${ACCENT}`,
                }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, letterSpacing: "-0.3px", color: "text.primary" }}
              >
                lucle
              </Typography>
            </Box>
            <Tooltip title={dark ? "Light mode" : "Dark mode"}>
              <IconButton
                onClick={toggleMode}
                size="small"
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                sx={{
                  color: "text.secondary",
                  "&:hover": { color: ACCENT, background: alpha(ACCENT, 0.1) },
                }}
              >
                {dark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v: string) => { setTab(v); setError(""); }}
            aria-label="Sign in or sign up"
            sx={{
              minHeight: 40,
              mb: 3,
              p: "4px",
              borderRadius: 2,
              background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
              "& .MuiTabs-indicator": {
                height: "100%",
                borderRadius: "9px",
                background: dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)",
                border: `1px solid ${alpha(ACCENT, 0.3)}`,
                boxShadow: `0 0 16px ${alpha(ACCENT, 0.3)}`,
              },
              "& .MuiTabs-flexContainer": { gap: 0 },
            }}
          >
            {(["Sign In", "Sign Up"] as const).map((label, i) => (
              <Tab
                key={label}
                id={`tab-${String(i + 1)}`}
                label={label}
                value={String(i + 1)}
                sx={{
                  flex: 1,
                  minHeight: 36,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "text.secondary",
                  borderRadius: "9px",
                  transition: "color 0.18s",
                  "&.Mui-selected": { color: "text.primary" },
                }}
              />
            ))}
          </Tabs>

          <TabPanel value="1" current={tab}>
            <Signin onSignin={handleSignin} error={setError} />
          </TabPanel>
          <TabPanel value="2" current={tab}>
            <Signup
              successfullSignup={successfullSignup}
              onSignup={handleSignup}
              error={setError}
            />
          </TabPanel>

          {/* Error banner */}
          {error && (
            <Alert
              severity="error"
              variant="outlined"
              sx={{
                mt: 2,
                borderRadius: 2,
                background: "rgba(255,107,107,0.08)",
                border: "1px solid rgba(255,107,107,0.25)",
                color: "#ff6b6b",
                fontSize: 13,
                "& .MuiAlert-icon": { color: "#ff6b6b" },
                "@keyframes shake": {
                  "0%,100%": { transform: "translateX(0)" },
                  "25%":     { transform: "translateX(-4px)" },
                  "75%":     { transform: "translateX(4px)" },
                },
                animation: "shake 0.3s ease",
              }}
            >
              {error}
            </Alert>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}
