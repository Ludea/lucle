import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router";

import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";

import CreateDB from "views/Install/createDB";
import CreateDefaultUser from "views/Install/createUser";
import { createUser, createDB } from "utils/rpc";
import { LucleRPC } from "context/Luclerpc";

const steps = ["Create Database", "Create default user"];

export interface DBInfos {
  dbName?: string;
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
}

interface InstallStepProps {
  step: number;
  selectedDB: number;
  setSelectedDB: (dbType: number) => void;
  setUsername: (user: string) => void;
  setPassword: (pass: string) => void;
  setConfirmPassword: (confirmPass: string) => void;
  setPasswordStrength: (strength: number) => void;
  setEmail: (email: string) => void;
  dbInfos: DBInfos | undefined;
  setDBInfos: (infos: DBInfos) => void;
}

const SQLITE_DB = 2;

function InstallStep({
  step,
  selectedDB,
  setSelectedDB,
  setUsername,
  setPassword,
  setConfirmPassword,
  setPasswordStrength,
  setEmail,
  dbInfos,
  setDBInfos,
}: InstallStepProps) {
  switch (step) {
    case 1:
      return (
        <CreateDB
          dbInfos={dbInfos}
          setDBInfos={setDBInfos}
          setSelectedDB={setSelectedDB}
          selectedDB={selectedDB}
        />
      );
    case 2:
      return (
        <CreateDefaultUser
          user={setUsername}
          password={setPassword}
          confirmPassword={setConfirmPassword}
          passwordStrength={setPasswordStrength}
          email={setEmail}
        />
      );
    default:
      return null;
  }
}

function validateStep0(selectedDB: number, dbInfos: DBInfos | undefined): string {
  if (selectedDB === SQLITE_DB) {
    if (!dbInfos?.dbName?.trim()) return "Please enter a database file path";
  } else {
    if (!dbInfos?.dbName?.trim()) return "Please enter a database name";
    if (!dbInfos?.hostname?.trim()) return "Please enter a host";
  }
  return "";
}

function validateStep1(username: string, password: string, confirmPassword: string): string {
  if (!username.trim()) return "Username is required";
  if (!password) return "Password is required";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
}

export default function Install() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [dbInfos, setDBInfos] = useState<DBInfos | undefined>(undefined);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedDB, setSelectedDB] = useState<number>(0);
  const navigate = useNavigate();
  const client = useContext(LucleRPC);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSetSelectedDB = (dbType: number) => {
    setSelectedDB(dbType);
    setDBInfos(undefined); // reset infos on DB type change
  };

  const handleClick = () => {
    setError("");

    switch (activeStep) {
      case 0: {
        const validationError = validateStep0(selectedDB, dbInfos);
        if (validationError) {
          setError(validationError);
          return;
        }
        setLoading(true);
        createDB(client, selectedDB, dbInfos?.dbName ?? "", dbInfos)
          .then(() => {
            setActiveStep((prev) => prev + 1);
          })
          .catch((err: { rawMessage: string }) => {
            setError(err.rawMessage);
          })
          .finally(() => {
            setLoading(false);
          });
        break;
      }
      case 1: {
        const validationError = validateStep1(username, password, confirmPassword);
        if (validationError) {
          setError(validationError);
          return;
        }
        setLoading(true);
        createUser(client, username, password, email, "admin")
          .then(() => {
            setActiveStep((prev) => prev + 1);
            timerRef.current = setTimeout(() => navigate("/"), 5000);
          })
          .catch((err: { rawMessage: string }) => {
            setError(err.rawMessage);
          })
          .finally(() => {
            setLoading(false);
          });
        break;
      }
      default:
        break;
    }
  };

  const isFinished = activeStep === steps.length;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "center",
        bgcolor: "background.default",
        p: { xs: 0, sm: 2 },
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !loading) handleClick();
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: { sm: 560 },
          minHeight: { xs: "100vh", sm: "auto" },
          p: { xs: 3, sm: 5 },
          borderRadius: { xs: 0, sm: 2 },
          boxShadow: { xs: "none", sm: undefined },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 4, textAlign: "center" }}>
          Lucle Setup
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel error={index === activeStep && Boolean(error)}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {isFinished ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Setup complete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Redirecting to the home page in 5 seconds…
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <Box sx={{ flex: 1 }}>
              <InstallStep
                step={activeStep + 1}
                selectedDB={selectedDB}
                setSelectedDB={handleSetSelectedDB}
                setUsername={setUsername}
                setPassword={setPassword}
                setConfirmPassword={setConfirmPassword}
                setPasswordStrength={setPasswordStrength}
                setEmail={setEmail}
                dbInfos={dbInfos}
                setDBInfos={setDBInfos}
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column-reverse", sm: "row" },
                justifyContent: "space-between",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                variant="outlined"
                disabled={activeStep === 0 || loading}
                onClick={() => {
                  setError("");
                  setActiveStep((prev) => prev - 1);
                }}
                sx={{ minWidth: 100 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                disabled={loading || (isLastStep && passwordStrength < 3)}
                onClick={handleClick}
                sx={{ minWidth: 100 }}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {isLastStep ? "Finish" : "Next"}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
