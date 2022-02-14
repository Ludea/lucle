import Editor from 'components/Editor'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { get, post } from 'utils/Api';

const OnlineEditor = () => {
  return(
    <div>
    <TextField
          id="title"
          label="Title"
          defaultValue=""
          fullWidth
     />
    <Editor />
    <Button
      variant="contained"
//      onClick={get}
    >
    Send
    </Button>
    </div>
  );
}

export default OnlineEditor;
