import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";

import PasswordStrengthBar from "react-password-strength-bar";

function Signup({
  successfullSignup,
  onSignup,
  error,
}: {
  successfullSignup: boolean;
  onSignup: void;
  error: string;
}) {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [emptyUsername, setEmptyUsername] = useState<boolean>();
  const [emptyEmail, setEmptyEmail] = useState<boolean>();
  const [emptyPassword, setEmptyPassword] = useState<boolean>();
  const [emptyConfirmPassword, setEmptyConfirmPassword] = useState<boolean>();
  const [passwordStrengh, setPasswordStrengh] = useState<number>(0);
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        marginTop: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {!successfullSignup ? (
        <Box sx={{ mt: 1 }}>
          <TextField
            error={emptyUsername}
            autoFocus={emptyUsername}
            margin="normal"
            required
            fullWidth
            id="user"
            label="Username"
            name="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
          <TextField
            error={emptyEmail}
            autoFocus={emptyEmail}
            margin="normal"
            required
            fullWidth
            id="user"
            label="Email"
            name="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <TextField
            error={emptyPassword}
            autoFocus={emptyPassword}
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
          <PasswordStrengthBar
            password={password}
            onChangeScore={(score) => {
              setPasswordStrengh(score);
            }}
          />
          <TextField
            error={emptyConfirmPassword}
            autoFocus={emptyConfirmPassword}
            margin="normal"
            required
            fullWidth
            name="confirm-password"
            label="Confirm Password"
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
            }}
          />
          <Button
            disabled={passwordStrengh < 3}
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={() => {
              setEmptyUsername(username.length === 0);
              setEmptyPassword(password.length === 0);
              setEmptyConfirmPassword(confirmPassword.length === 0);
              setEmptyEmail(email.length === 0);
              if (!username || !email || !password || !confirmPassword) {
                error("Please fill all inputs");
              } else if (!emptyPassword && password === confirmPassword) {
                onSignup(username, password, email);
              } else {
                error("password doesn't match");
              }
            }}
          >
            Sign up
          </Button>
        </Box>
      ) : (
        <div>
          {" "}
          You successfully sign up ! You will be redirected in few seconds.
          {setTimeout(() => navigate("/"), 10000)}
        </div>
      )}
    </Box>
  );
}

export default Signup;
