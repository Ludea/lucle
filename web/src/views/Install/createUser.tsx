import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import PasswordStrengthBar from "react-password-strength-bar";

interface CreateDefaultUserProps {
  user: (value: string) => void;
  password: (value: string) => void;
  confirmPassword: (value: string) => void;
  email: (value: string) => void;
  passwordStrength: (score: number) => void;
}

export default function CreateDefaultUser({
  user,
  password,
  confirmPassword,
  email,
  passwordStrength,
}: CreateDefaultUserProps) {
  const [passwd, setPasswd] = useState<string>("");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography variant="body2" color="text.secondary">
        This account will have full administrator access.
      </Typography>

      <TextField
        id="login"
        label="Username"
        variant="outlined"
        fullWidth
        autoComplete="username"
        slotProps={{ htmlInput: { style: { fontSize: 16 } } }}
        onChange={(e) => user(e.target.value)}
      />

      <TextField
        id="password"
        label="Password"
        variant="outlined"
        type="password"
        fullWidth
        autoComplete="new-password"
        slotProps={{ htmlInput: { style: { fontSize: 16 } } }}
        onChange={(e) => {
          setPasswd(e.target.value);
          password(e.target.value);
        }}
      />

      <PasswordStrengthBar password={passwd} onChangeScore={(score) => passwordStrength(score)} />

      <TextField
        id="password-confirm"
        label="Confirm password"
        variant="outlined"
        type="password"
        fullWidth
        autoComplete="new-password"
        slotProps={{ htmlInput: { style: { fontSize: 16 } } }}
        onChange={(e) => confirmPassword(e.target.value)}
      />

      <TextField
        id="email"
        label="Email"
        variant="outlined"
        type="email"
        fullWidth
        autoComplete="email"
        slotProps={{ htmlInput: { style: { fontSize: 16 } } }}
        onChange={(e) => email(e.target.value)}
      />
    </Box>
  );
}
