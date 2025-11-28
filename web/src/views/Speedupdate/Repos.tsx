import { useState, useContext } from "react";
import Button from "@mui/material/Button";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";

//RPC Connect
import { Repo, Platforms } from "gen/speedupdate_pb";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";

// Context
import { useAuth } from "context/Auth";
import { LucleRPC } from "context/Luclerpc";

// api
import { init, isInit } from "utils/speedupdaterpc";
import { registerUpdateServer } from "utils/rpc";

const transport = createGrpcWebTransport({
  //  baseUrl: "https://repo.marlin-atlas.ts.net",
  baseUrl: "http://127.0.0.1:8012",
});
const client = createClient(Repo, transport);

function ListRepo({
  selectedRepoName,
  selectedRepoHosts,
}: {
  selectedRepoName: string;
  selectedRepoHosts: string /*Platforms[]*/;
}) {
  const [listRepo, setListRepo] = useState<Map<string, string[]>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<string>("");
  const [checked, setChecked] = useState<any>({
    win64: false,
    macos_x86_64: false,
    macos_arm64: false,
    linux: false,
  });

  const lucleClient = useContext(LucleRPC);
  const auth = useAuth();

  const getPlatforms = () => {
    const selectedPlatforms: Platforms[] = [];
    const hosts = Object.keys(checked).filter((key) => checked[key] === true);
    for (const host of hosts) {
      if (host === "win64") selectedPlatforms.push(Platforms.WIN64);
      if (host === "macos_x86_64")
        selectedPlatforms.push(Platforms.MACOS_X86_64);
      if (host === "macos_arm64") selectedPlatforms.push(Platforms.MACOS_ARM64);
      if (host === "linux") selectedPlatforms.push(Platforms.LINUX);
    }
    return selectedPlatforms;
  };

  return (
    <div>
      {listRepo.size > 0
        ? Array.from(listRepo.keys()).map(
            (repo_name: string, index: number) => (
              <Button
                key={index}
                variant="contained"
                onClick={() => {
                  setError(null);
                  const platforms = listRepo.get(repo_name);
                  isInit(client, repo_name, platforms, "game")
                    .then(() => {
                      const current = new Map<string, string[]>();
                      const platformInt: Platforms[] = [];
                      for (const host of platforms) {
                        if (host === "win64") platformInt.push(Platforms.WIN64);
                        if (host === "macos_x86_64")
                          platformInt.push(Platforms.MACOS_X86_64);
                        if (host === "macos_arm64")
                          platformInt.push(Platforms.MACOS_ARM64);
                        if (host === "linux") platformInt.push(Platforms.LINUX);
                      }
                      current.set(repo_name, platforms);
                      selectedRepoName(current);
                      selectedRepoHosts("platformInt");
                      //setCurrentRepo(current);
                      //setPlatformsEnum(platformInt);
                      localStorage.setItem(
                        "current_repo",
                        JSON.stringify({ repo_name, platforms }),
                      );
                    })
                    .catch((err) => {
                      setError(err.rawMessage);
                    });
                }}
              >
                {repo_name}
              </Button>
            ),
          )
        : null}
      <Grid container>
        <Grid>
          <TextField
            id="join-update-server"
            label="path"
            onChange={(e: any) => {
              setPath(e.currentTarget.value);
            }}
          />
        </Grid>
        <Button variant="contained">Join repository</Button>
      </Grid>
      <Grid container>
        <Grid size={12}>
          <FormLabel component="legend">Platforms</FormLabel>
          <FormGroup sx={{ width: "20%" }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="win64"
                  checked={checked.Win64}
                  onChange={(event) => {
                    setChecked((checked: any) => ({
                      ...checked,
                      [event.target.name]: event.target.checked,
                    }));
                  }}
                />
              }
              label="Win64"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="macos_x86_64"
                  checked={checked.Macos_x86_64}
                  onChange={(event) => {
                    setChecked((checked: any) => ({
                      ...checked,
                      [event.target.name]: event.target.checked,
                    }));
                  }}
                />
              }
              label="Macos x86_64"
            />
          </FormGroup>
          <FormGroup sx={{ width: "20%" }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="macos_arm64"
                  checked={checked.Macos_arm64}
                  onChange={(event) => {
                    setChecked((checked: any) => ({
                      ...checked,
                      [event.target.name]: event.target.checked,
                    }));
                  }}
                />
              }
              label="MacOS arm64"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="linux"
                  checked={checked.linux}
                  onChange={(event) => {
                    setChecked((checked: any) => ({
                      ...checked,
                      [event.target.name]: event.target.checked,
                    }));
                  }}
                />
              }
              label="Linux"
            />
          </FormGroup>
        </Grid>
        <TextField
          id="outlined-required"
          label="path"
          value={path}
          onChange={(e: any) => {
            setPath(e.currentTarget.value);
          }}
        />
        <Button
          variant="contained"
          onClick={() => {
            setError(null);
            init(client, path, checked)
              .then(() => {
                setPath("");
                const hostsEnum = getPlatforms();
                const hosts = Object.keys(checked).filter(
                  (key) => checked[key] === true,
                );
                let list = new Map<string, string[]>();
                list = listRepo;
                const current = new Map<string, string[]>();
                current.set(path, hosts);
                list.set(path, hosts);
                //setCurrentRepo(current);
                setListRepo(list);
                //setPlatformsEnum(hostsEnum);
                localStorage.setItem(
                  "current_repo",
                  JSON.stringify({ path, hosts }),
                );
                localStorage.setItem(
                  "platformsEnum",
                  JSON.stringify(hostsEnum),
                );
                localStorage.setItem(
                  "repositories",
                  JSON.stringify(Object.fromEntries(list)),
                );
                const hosts_string = getPlatforms();
                registerUpdateServer(
                  lucleClient,
                  auth.username,
                  path,
                  hosts_string,
                ).catch((err) => {
                  setError(err.rawMessage);
                });
              })
              .catch((err) => {
                setError(err.rawMessage);
              });
          }}
        >
          Create new repository
        </Button>
      </Grid>
      {error}
    </div>
  );
}

export default ListRepo;
