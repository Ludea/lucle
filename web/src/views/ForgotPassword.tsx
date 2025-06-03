import { useState, useContext } from "react";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

// Context
import { LucleRPCProvider } from "context/Luclerpc";

// RPC
import { forgotPassword } from "utils/rpc";

function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const client = useContext(LucleRPCProvider);

  return (
    <div>
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
        }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        onClick={() => forgotPassword(client, email)}
      >
        Send
      </Button>
    </div>
  );
}

export default ForgotPassword;
