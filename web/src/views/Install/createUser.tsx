import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

import PasswordStrengthBar from "react-password-strength-bar";

export default function CreateDefaultUser({
  user,
  password,
  confirmPassword,
  email,
  passwordStrengh,
}: {
  user: any;
  password: any;
  confirmPassword: any;
  email: any;
  passwordStrengh;
  onCreatingUser;
}) {
  const [passwd, setPasswd] = useState();
  return (
    <Box
      component="form"
      sx={{
        "& > :not(style)": { m: 1, width: "25ch" },
      }}
      noValidate
      autoComplete="off"
    >
      <TextField
        // error={onCreatingUser.username_empty}
        id="login"
        label="Username"
        variant="standard"
        onChange={(event) => {
          user(event.target.value);
        }}
      />
      <TextField
        id="password"
        label="Password"
        variant="standard"
        type="password"
        onChange={(event) => {
          setPasswd(event.target.value);
          password(event.target.value);
        }}
      />
      <TextField
        id="password-confirm"
        label="Confirm password"
        variant="standard"
        type="password"
        onChange={(event) => {
          confirmPassword(event.target.value);
        }}
      />
      <PasswordStrengthBar
        password={passwd}
        onChangeScore={(score) => {
          passwordStrengh(score);
        }}
      />
      <TextField
        id="email"
        label="email"
        variant="standard"
        onChange={(event) => {
          email(event.target.value);
        }}
      />
    </Box>
  );
}
