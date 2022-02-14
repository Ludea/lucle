import { useState } from 'react' ;
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const Register = () => {
  const [login, setLogin] = useState<String>();
  const [password, setPassword] = useState<String>();
  const [repeatPassword, setRepeatPassword] = useState<String>();
  const [email, setEmail] = useState<String>();

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
   <TextField
      id="repeatpassword"
      label="Repeat password"
      value={repeatPassword}
      onChange={ e => setRepeatPassword(e.target.value) }
   />
   <TextField
      id="email"
      label="Email"
      value={email}
      onChange={ e => setEmail(e.target.value) }
   />
   <Button
     variant="contained"
   >
   Login
   </Button>
   </div>
  );
}

export default Register;
