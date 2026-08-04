import { useState, useContext } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Tab from "@mui/material/Tab";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Components
import Signin from "components/Signin";
import Signup from "components/Signup";
import { createUser } from "utils/rpc";

// Context
import { LucleRPC } from "context/Luclerpc";
import { useAuth } from "context/Auth";

const theme = createTheme();

function Login() {
  const [tab, setTab] = useState("1");
  const [error, setError] = useState<string>("");
  const [successfullSignup, setSuccessfullSignup] = useState<boolean>(false);
  const auth = useAuth();
  const client = useContext(LucleRPC);

  const handleSignup = (username: string, password: string, email: string) => {
    setError("");
    // "role" isn't modeled by the backend yet (no such field in the proto or
    // the Rust handler) — passed for parity with the install flow's admin
    // user creation, which is the only other caller of createUser().
    createUser(client, username, password, email, "user")
      .then(() => {
        setSuccessfullSignup(true);
      })
      .catch((err: unknown) => {
        setError((err as { rawMessage: string }).rawMessage);
      });
  };

  const handleSignin = (username: string, password: string, remember: boolean) => {
    setError("");
    if (remember) {
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);
    }
    auth.Login({ username, password }).catch((err: unknown) => {
      setError((err as { rawMessage: string }).rawMessage);
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabContext value={tab}>
            <TabList
              onChange={(_, activeTab) => {
                setTab(activeTab);
              }}
              aria-label="signin-signup"
            >
              <Tab label="Sign In" value="1" />
              <Tab label="Sign Up" value="2" />
            </TabList>
            <TabPanel value="1">
              <Signin onSignin={handleSignin} error={setError} />
            </TabPanel>
            <TabPanel value="2">
              <Signup
                successfullSignup={successfullSignup}
                onSignup={handleSignup}
                error={setError}
              />
            </TabPanel>
          </TabContext>
          {error}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default Login;
