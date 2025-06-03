import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

function InstallSpeedupdate() {
  const [speedupdateURL, setSpeedupdateURL] = useState("");
  const [ghToken, setGhToken] = useState("");

  return (
    <Box>
      <TextField
        margin="normal"
        required
        fullWidth
        id="update_server"
        label="Update server hostname"
        name="update_server"
        value={speedupdateURL}
        onChange={(event) => {
          setSpeedupdateURL(event.target.value);
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="gh_token"
        label="Github token"
        name="update_server"
        value={ghToken}
        onChange={(event) => {
          setGhToken(event.target.value);
        }}
      />
    </Box>
  );
}

export default InstallSpeedupdate;
