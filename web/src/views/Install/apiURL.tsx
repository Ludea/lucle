import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

function ApiURL({ url }: { url: String }) {
  return (
    <Box>
      <TextField
        id="api"
        label="Api url"
        variant="standard"
        onChange={(event) => {
          url(event.target.value);
        }}
      />
    </Box>
  );
}

export default ApiURL;
