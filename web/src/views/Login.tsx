import { useState, useContext } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import Signin from "components/Signin";
import Signup from "components/Signup";
import { createUser } from "utils/rpc";
import { LucleRPC } from "context/Luclerpc";
import { useAuth } from "context/Auth";

// ─── Design tokens ────────────────────────────────────────────────
const ACCENT = "#6C63FF";
const BG = "#0d1117";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: ACCENT },
    background: { default: BG, paper: "rgba(255,255,255,0.045)" },
    error: { main: "#ff6b6b" },
    text: {
      primary: "#e6edf3",
      secondary: "rgba(230,237,243,0.5)",
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
          background: ${BG};
        }
      `,
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.055)",
          borderRadius: 10,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.12)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.25)",
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
        input: { color: "#e6edf3" },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "rgba(230,237,243,0.5)",
          "&.Mui-focused": { color: ACCENT },
          "&.Mui-error": { color: "#ff6b6b" },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          "&:active": { transform: "scale(0.98)" },
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
      styleOverrides: {
        root: { marginLeft: 0 },
      },
    },
  },
});

// ─── Background blobs (pure MUI sx, no CSS file) ─────────────────
const BlobSx = {
  position: "fixed" as const,
  inset: 0,
  pointerEvents: "none" as const,
  zIndex: 0,
  overflow: "hidden",
  "& span": {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(80px)",
    opacity: 0.18,
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
    to: { transform: "translate(30px,20px) scale(1.06)" },
  },
};

// ─── Component ───────────────────────────────────────────────────
export default function Login() {
  const [tab, setTab] = useState("1");
  const [error, setError] = useState<string>("");
  const [successfullSignup, setSuccessfullSignup] = useState<boolean>(false);
  const auth = useAuth();
  const client = useContext(LucleRPC);

  const handleSignup = (username: string, password: string, email: string) => {
    setError("");
    createUser(client, username, password, email, "user")
      .then(() => {
        setSuccessfullSignup(true);
      })
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Animated background */}
      <Box sx={BlobSx} aria-hidden="true">
        <span />
        <span />
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
            background: "rgba(255,255,255,0.045)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: [
              "0 0 0 0.5px rgba(255,255,255,0.06) inset",
              "0 32px 64px rgba(0,0,0,0.5)",
              `0 0 80px ${alpha(ACCENT, 0.2)}`,
            ].join(","),
          }}
        >
          {/* Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3.5 }}>
            <Box
              sx={{
                width: 9,
                height: 9,
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

          {/* Tabs */}
          <TabContext value={tab}>
            <TabList
              onChange={(_, v: string) => {
                setTab(v);
                setError("");
              }}
              aria-label="Sign in or sign up"
              sx={{
                minHeight: 40,
                mb: 3,
                p: "4px",
                borderRadius: 2,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                "& .MuiTabs-indicator": {
                  height: "100%",
                  borderRadius: "9px",
                  background: "rgba(255,255,255,0.07)",
                  border: `1px solid ${alpha(ACCENT, 0.3)}`,
                  boxShadow: `0 0 16px ${alpha(ACCENT, 0.3)}`,
                },
                "& .MuiTabs-flexContainer": { gap: 0 },
              }}
            >
              {(["Sign In", "Sign Up"] as const).map((label, i) => (
                <Tab
                  key={label}
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
            </TabList>

            <TabPanel value="1" sx={{ p: 0 }}>
              <Signin onSignin={handleSignin} error={setError} />
            </TabPanel>
            <TabPanel value="2" sx={{ p: 0 }}>
              <Signup
                successfullSignup={successfullSignup}
                onSignup={handleSignup}
                error={setError}
              />
            </TabPanel>
          </TabContext>

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
                  "25%": { transform: "translateX(-4px)" },
                  "75%": { transform: "translateX(4px)" },
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
