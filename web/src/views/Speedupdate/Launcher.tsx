import { useState } from "react";

import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

//GH Api
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: "",
});

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
  const [game, setGame] = useState<String>("");
  const [updateURL, setUpdateURL] = useState<String>(
    "https://repo.marlin-atlas.ts.net",
  );
  const [disableLauncherCreation, setDisableLauncherCreation] =
    useState<boolean>(false);

  let status: string = "queued";

  const StartandFollowGHAction = async () => {
    let launcherOptions = {
      game_name: game,
      repository_url: updateURL,
    };

    setDisableLauncherCreation(true);

    octokit.rest.actions.createWorkflowDispatch({
      owner: "Ludea",
      repo: "Sparus",
      workflow_id: "dispatch.yml",
      ref: "main",
      inputs: {
        content: JSON.stringify(launcherOptions),
      },
    });

    new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
      octokit.rest.actions
        .listWorkflowRuns({
          owner: "Ludea",
          repo: "Sparus",
          workflow_id: "dispatch.yml",
        })
        .then((result) => {
          while (["queued", "in_progress"].includes(status)) {
            new Promise((resolve) => setTimeout(resolve, 500)).then(() => {
              octokit.rest.actions
                .getWorkflowRun({
                  owner: "Ludea",
                  repo: "Sparus",
                  run_id: result.data.workflow_runs[0].id,
                })
                .then((res) => {
                  status = res.data.status;
                  if (status === "completed") {
                    setDisableLauncherCreation(false);
                    return;
                  }
                })
                .catch(() => setDisableLauncherCreation(false));
            });
          }
        }),
    );
  };

  const getWorkflowRun = () => {
    octokit.rest.actions
      .listWorkflowRuns({
        owner: "Ludea",
        repo: "Sparus",
        workflow_id: "dispatch.yml",
      })
      .then((result) => {
        while (
          //result.data.workflow_runs[0].status === "queued" ||
          result.data.workflow_runs[0].status !== "in_progress"
        ) {
          /*          octokit.rest.actions
            .getWorkflowRun({
              owner: "Ludea",
              repo: "Sparus",
              run_id: result.data.workflow_runs[0].id,
            })
            .then((res) => {
              console.log("12: ", res);
              setDisableLauncherCreation(false);
            })
            .catch(() => setDisableLauncherCreation(false)); */
        }
      })
      .catch(() => setDisableLauncherCreation(false));
  };

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
            sx={{
              width: "30%",
            }}
            value={game}
            onChange={(event) => {
              setGame(event.target.value);
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            margin="normal"
            required
            id="update_server"
            label="Url of the update server"
            name="update_server"
            autoComplete="update_server"
            sx={{
              width: "30%",
            }}
            value={updateURL}
            onChange={(event) => {
              setUpdateURL(event.target.value);
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
        <Button
          disabled={disableLauncherCreation}
          variant="contained"
          onClick={StartandFollowGHAction}
        >
          Create Launcher
        </Button>
      </Grid>
    </div>
  );
}

export default Launcher;
