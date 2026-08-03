import { useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DownloadIcon from "@mui/icons-material/Download";
import Section from "./Section";
import SectionLabel from "./SectionLabel";

type OS = "windows" | "macos" | "debian" | "fedora" | "unknown";

function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("fedora")) return "fedora";
  if (ua.includes("linux")) return "debian";
  return "unknown";
}

interface OSConfig {
  label: string;
  os: OS;
  href: string;
  note?: string;
}

const OS_LIST: OSConfig[] = [
  { os: "windows", label: "Windows", href: "#", note: ".exe" },
  { os: "macos", label: "macOS", href: "#", note: ".dmg" },
  { os: "debian", label: "Debian", href: "#", note: ".deb" },
  { os: "fedora", label: "Fedora", href: "#", note: ".rpm" },
];

function Download() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const detectedOS = useMemo(() => detectOS(), []);

  useEffect(() => {
    fetch("/api/download")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setDownloadUrl(data.url);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const detectedConfig = OS_LIST.find((o) => o.os === detectedOS);
  const otherOS = OS_LIST.filter((o) => o.os !== detectedOS);

  return (
    <Section id="download">
      <SectionLabel>Download</SectionLabel>
      <Typography variant="h2" sx={{ fontSize: "clamp(30px, 4vw, 44px)", mb: 2, maxWidth: 520 }}>
        Get Sparus
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 480 }}>
        Download the latest version of the Sparus launcher for your platform.
      </Typography>

      <Card sx={{ maxWidth: 560 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Primary — detected OS */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              {detectedOS !== "unknown" ? "Recommended for your system" : "Download"}
            </Typography>

            {loading ? (
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled
                startIcon={<CircularProgress size={18} color="inherit" />}
                sx={{ py: 1.5 }}
              >
                Detecting your platform…
              </Button>
            ) : error || !downloadUrl ? (
              <Button variant="contained" size="large" fullWidth disabled sx={{ py: 1.5 }}>
                Unavailable — check back soon
              </Button>
            ) : (
              <Button
                component="a"
                href={downloadUrl}
                variant="contained"
                size="large"
                fullWidth
                startIcon={<DownloadIcon />}
                sx={{ py: 1.5 }}
              >
                Download for {detectedConfig?.label ?? "your platform"}
                {detectedConfig?.note && (
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ ml: 1, opacity: 0.7, fontWeight: 400 }}
                  >
                    {detectedConfig.note}
                  </Typography>
                )}
              </Button>
            )}
          </Box>

          {/* Secondary — other OS */}
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              Other platforms
            </Typography>
            <Stack spacing={1}>
              {otherOS.map(({ os, label, href, note }) => (
                <Button
                  key={os}
                  component="a"
                  href={href}
                  variant="outlined"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  sx={{
                    justifyContent: "flex-start",
                    color: "text.secondary",
                    borderColor: "divider",
                    "&:hover": { borderColor: "primary.main", color: "text.primary" },
                  }}
                >
                  {label}
                  {note && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 1, opacity: 0.6, fontWeight: 400 }}
                    >
                      {note}
                    </Typography>
                  )}
                </Button>
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Section>
  );
}

export default Download;
