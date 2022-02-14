import { useState } from 'react' ;
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const Login = () => {
  const [login, setLogin] = useState<String>();
  const [password, setPassword] = useState<String>();

  return(
   <div>
   <TextField
      id="login"
      label="Login"
      value={login}
      onChange={ e => setLogin(e.target.value) }
   />
   <TextField
      id="password"
      label="Password"
      value={password}
      onChange={ e => setPassword(e.target.value) }
   />
   <Button
     variant="contained"
   >
   Login
   </Button>
   </div>
  );
}

export default Login;
