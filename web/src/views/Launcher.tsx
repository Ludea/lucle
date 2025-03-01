import { useState, useContext } from "react";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

function Launcher() {
  const [game, setGame] = useState("");

  return (
    <div>
      <TextField
        margin="normal"
        required
        fullWidth
        id="game"
        label="Game"
        name="game"
        autoComplete="game"
        autoFocus
        value={game}
        onChange={(event) => {
          setGame(event.target.value);
        }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        // onClick={() => }
      >
        Crete Launcher
      </Button>
    </div>
  );
}

export default Launcher;
