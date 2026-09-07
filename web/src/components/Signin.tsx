import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import FormHelperText from "@mui/material/FormHelperText";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import { Link as RouterLink } from "react-router";
import { alpha } from "@mui/material/styles";

const ACCENT = "#6C63FF";

interface SigninProps {
  onSignin: (username: string, password: string, remember: boolean) => void;
  error: (message: string) => void;
}

export default function Signin({ onSignin, error }: SigninProps) {
  const [username, setUsername]       = useState<string>(localStorage.getItem("username") ?? "");
  const [password, setPassword]       = useState<string>("");
  const [remember, setRemember]       = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [touched, setTouched]         = useState({ username: false, password: false });

  const usernameErr = touched.username && username.length === 0 ? "Username is required" : "";
  const passwordErr = touched.password && password.length === 0 ? "Password is required" : "";

  const handleSubmit = () => {
    setTouched({ username: true, password: true });
    if (!username || !password) {
      error("Please fill all fields");
      return;
    }
    onSignin(username, password, remember);
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
      onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
    >
      <TextField
        fullWidth
        required
        label="Username or Email"
        autoComplete="username"
        value={username}
        error={!!usernameErr}
        helperText={usernameErr}
        onChange={(e) => setUsername(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, username: true }))}
        inputProps={{ "aria-label": "Username or Email" }}
      />

      <FormControl fullWidth required variant="outlined" error={!!passwordErr}>
        <InputLabel htmlFor="signin-password">Password</InputLabel>
        <OutlinedInput
          id="signin-password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          label="Password"
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                onMouseUp={(e) => e.preventDefault()}
                edge="end"
                size="small"
                sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          }
        />
        {passwordErr && <FormHelperText>{passwordErr}</FormHelperText>}
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            sx={{
              color: "text.secondary",
              "&.Mui-checked": { color: ACCENT },
            }}
          />
        }
        label="Remember me"
        sx={{ "& .MuiFormControlLabel-label": { fontSize: 14, color: "text.secondary" } }}
      />

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSubmit}
        sx={{ mt: 0.5 }}
      >
        Sign In
      </Button>

      <Link
        component={RouterLink}
        to="/forgot"
        underline="hover"
        sx={{
          fontSize: 13,
          color: "text.secondary",
          textAlign: "right",
          "&:hover": { color: alpha(ACCENT, 0.9) },
        }}
      >
        Forgot password?
      </Link>
    </Box>
  );
}
