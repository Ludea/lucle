import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Editor from "components/Editor";

function OnlineEditor() {
  return (
    <div>
      <TextField id="title" label="Title" defaultValue="" fullWidth />
      <Editor />
      <Button variant="contained">Send</Button>
    </div>
  );
}

export default OnlineEditor;
