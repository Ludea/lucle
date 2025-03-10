import { useState, useContext } from "react";

import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

function Launcher() {
  const [game, setGame] = useState("");

  return (
    <div>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            margin="normal"
            required
            id="game"
            label="Game name"
            name="game"
            autoComplete="game"
            autoFocus
            value={game}
            onChange={(event) => {
              setGame(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
          >
            Upload Background
            <VisuallyHiddenInput
              type="file"
              onChange={(event) => console.log(event.target.files)}
              multiple
            />
          </Button>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
          >
            Upload Logo
            <VisuallyHiddenInput
              type="file"
              onChange={(event) => console.log(event.target.files)}
              multiple
            />
          </Button>
        </Grid>
        <Button component="label" role={undefined} variant="contained">
          Create Launcher
        </Button>
      </Grid>
    </div>
  );
}

export default Launcher;
