import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import { useNavigate } from "react-router";
import { alpha } from "@mui/material/styles";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCENT   = "#6C63FF";

// ─── Password strength ────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8)                    score++;
  if (pw.length >= 12)                   score++;
  if (/[A-Z]/.test(pw))                  score++;
  if (/[0-9]/.test(pw))                  score++;
  if (/[^A-Za-z0-9]/.test(pw))          score++;

  if (score <= 1) return { score, label: "Too weak",  color: "#ff6b6b" };
  if (score === 2) return { score, label: "Weak",     color: "#ffa94d" };
  if (score === 3) return { score, label: "Fair",     color: "#ffd43b" };
  if (score === 4) return { score, label: "Strong",   color: "#69db7c" };
  return              { score, label: "Very strong", color: "#40c057" };
}

function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (password.length === 0) return null;
  return (
    <Box sx={{ mt: 0.75 }}>
      <LinearProgress
        variant="determinate"
        value={(score / 5) * 100}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.08)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 2,
            backgroundColor: color,
            transition: "transform 0.4s ease, background-color 0.3s ease",
          },
        }}
      />
      <Typography
        variant="caption"
        sx={{ color, mt: 0.5, display: "block", fontWeight: 500 }}
      >
        {label}
      </Typography>
    </Box>
  );
}

// ─── Types ────────────────────────────────────────────────────────
interface SignupProps {
  successfullSignup: boolean;
  onSignup: (username: string, password: string, email: string) => void;
  error: (message: string) => void;
}

// ─── Component ───────────────────────────────────────────────────
export default function Signup({ successfullSignup, onSignup, error }: SignupProps) {
  const [username, setUsername]             = useState<string>("");
  const [email, setEmail]                   = useState<string>("");
  const [password, setPassword]             = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [touched, setTouched] = useState({
    username: false,
    email:    false,
    password: false,
    confirm:  false,
  });

  const navigate = useNavigate();
  const { score } = getStrength(password);

  useEffect(() => {
    if (!successfullSignup) return;
    const t = setTimeout(() => { void navigate("/"); }, 5000);
    return () => clearTimeout(t);
  }, [successfullSignup, navigate]);

  if (successfullSignup) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          You&apos;re in!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Account created. Redirecting to sign in…
        </Typography>
      </Box>
    );
  }

  const usernameErr = touched.username && !username ? "Username is required" : "";
  const emailErr    = touched.email
    ? (!email ? "Email is required" : !EMAIL_RE.test(email) ? "Invalid email address" : "")
    : "";
  const passwordErr = touched.password && !password ? "Password is required" : "";
  const confirmErr  = touched.confirm && confirmPassword !== password
    ? "Passwords do not match"
    : "";

  const handleSubmit = () => {
    setTouched({ username: true, email: true, password: true, confirm: true });
    if (!username || !email || !password || !confirmPassword) {
      error("Please fill all fields");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      error("Please enter a valid email address");
      return;
    }
    if (password !== confirmPassword) {
      error("Passwords do not match");
      return;
    }
    onSignup(username, password, email);
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
      onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
    >
      <TextField
        fullWidth
        required
        label="Username"
        autoComplete="username"
        value={username}
        error={!!usernameErr}
        helperText={usernameErr}
        onChange={(e) => setUsername(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, username: true }))}
      />

      <TextField
        fullWidth
        required
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        error={!!emailErr}
        helperText={emailErr}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
      />

      <Box>
        <TextField
          fullWidth
          required
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          error={!!passwordErr}
          helperText={passwordErr}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        />
        <PasswordStrength password={password} />
      </Box>

      <TextField
        fullWidth
        required
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        error={!!confirmErr}
        helperText={confirmErr}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
      />

      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={score < 3}
        onClick={handleSubmit}
        title={score < 3 ? "Password is too weak" : undefined}
        sx={{
          mt: 0.5,
          "&.Mui-disabled": {
            background: alpha(ACCENT, 0.3),
            color: "rgba(255,255,255,0.4)",
          },
        }}
      >
        Create account
      </Button>
    </Box>
  );
}
