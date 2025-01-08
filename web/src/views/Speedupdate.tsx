import { useState, useEffect, useContext } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import TableRow from "@mui/material/TableRow";
import TableHead from "@mui/material/TableHead";
import TableCell from "@mui/material/TableCell";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TablePagination from "@mui/material/TablePagination";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import { alpha } from "@mui/material/styles";
import { DropzoneArea } from "mui2-file-dropzone";

// Icons
import WarningIcon from "@mui/icons-material/Warning";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

// RPC Connect
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { Repo, Platforms } from "gen/speedupdate_pb";

// api
import {
  init,
  isInit,
  registerVersion,
  unregisterVersion,
  setCurrentVersion,
  registerPackage,
  unregisterPackage,
  fileToDelete,
  compareStatus,
} from "utils/speedupdaterpc";
import { registerUpdateServer, listRepositories } from "utils/rpc";

// Context
import { useAuth } from "context/Auth";
import { LucleRPC } from "context/Luclerpc";

// import { uploadFile } from "utils/minio";

const transport = createGrpcWebTransport({
  // baseUrl: "https://api-repo.marlin-atlas.ts.net"
  baseUrl: "http://127.0.0.1:3001",
});
const client = createClient(Repo, transport);

const DisplaySizeUnit = (TotalSize: number) => {
  if (TotalSize > 0 && TotalSize < 1024) {
    return "B";
  }
  if (TotalSize < 1024 * 1024) {
    return "kB";
  }
  if (TotalSize < 1024 * 1024 * 1024) {
    return "MB";
  }
  if (TotalSize < 1024 * 1024 * 1024 * 1024) {
    return "GB";
  }
  return "-";
};

function Speedupdate() {
  const [currentRepo, setCurrentRepo] = useState<string>(
    localStorage.getItem("current_repo"),
  );
  const [currentVersion, getCurrentVersion] = useState<string>("");
  const [size, setSize] = useState<number>();
  const [version, setVersion] = useState<any>();
  const [platformsEnum, setPlatformsEnum] = useState<Platforms[]>(
    JSON.parse(localStorage.getItem("platformsEnum")),
  );
  const [canBePublished, setCanBePublished] = useState<boolean[]>([]);
  const [listPackages, setListPackages] = useState<string[]>([]);
  const [availableBinaries, setAvailableBinaries] = useState<string[]>([]);
  const [listVersions, setListVersions] = useState<any>();
  const [listRepo, setListRepo] = useState<string[]>([]);
  const [selectedVersionsValues, setSelectedVersionsValues] = useState<
    string[]
  >([]);
  const [binariesPage, setBinariesPage] = useState(0);
  const [packagesPage, setPackagesPage] = useState(0);
  const [versionsPage, setVersionsPage] = useState(0);
  const [visibleVersions, setVisibleVersions] = useState<string[]>([]);
  const [visiblePackages, setVisiblePackages] = useState<string[]>([]);
  const [visibleBinaries, setVisibleBinaries] = useState<string[]>([]);
  const [path, setPath] = useState<string>(localStorage.getItem("path") || "");
  const [fileObjects, setFileObjects] = useState();
  const [files, setFiles] = useState<any>();
  const [packagesPerPage, setPackagesPerPage] = useState(5);
  const [versionsPerPage, setVersionsPerPage] = useState(5);
  const [binariesPerPage, setBinariesPerPage] = useState(5);
  const [error, setError] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedVersions, setSelectedVersions] = useState<readonly number[]>(
    [],
  );
  const [selectedPackages, setSelectedPackages] = useState<readonly number[]>(
    [],
  );
  const [selectedPackagesValues, setSelectedPackagesValues] = useState<
    string[]
  >([]);
  const [selectedBinaries, setSelectedBinaries] = useState<readonly number[]>(
    [],
  );
  const [checked, setChecked] = useState<any>({
    win64: false,
    macos_x86_64: false,
    macos_arm64: false,
    linux: false,
  });

  const auth = useAuth();
  const lucleClient = useContext(LucleRPC);

  const isVersionsSelected = (id: number) => selectedVersions.includes(id);
  const numVersionsSelected = selectedVersions.length;

  const isPackagesSelected = (id: number) => selectedPackages.includes(id);
  const numPackagesSelected = selectedPackages.length;

  const isBinariesSelected = (id: number) => selectedBinaries.includes(id);
  const numBinariesSelected = selectedBinaries.length;

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

  useEffect(() => {
    const headers = new Headers();
    const { token } = auth;
    headers.set("Authorization", `Bearer ${token}`);
    async function Status() {
      const call = client.status(
        {
          path: currentRepo,
          platforms: platformsEnum,
        },
        { headers },
      );
      for await (const repo of call) {
        const compare_repo = repo.status.every((state) =>
          compareStatus(repo.status[0], state),
        );
        if (compare_repo) {
          const firstRepo = repo.status[0];
          setSize(firstRepo.size);
          getCurrentVersion(firstRepo.currentVersion);
          setListVersions(firstRepo.versions);
          const fullListPackages = [];
          firstRepo.packages.map((row) => {
            fullListPackages.push({ name: row, published: true });
          });
          firstRepo.availablePackages.map((row) => {
            fullListPackages.push({ name: row, published: false });
          });
          setListPackages(fullListPackages);
          setAvailableBinaries(firstRepo.availableBinaries);

          setVisibleVersions(
            firstRepo.versions.slice(
              versionsPage * versionsPerPage,
              versionsPage * versionsPerPage + versionsPerPage,
            ),
          );

          setVisiblePackages(
            fullListPackages.slice(
              packagesPage * packagesPerPage,
              packagesPage * packagesPerPage + packagesPerPage,
            ),
          );

          setVisibleBinaries(
            firstRepo.availableBinaries.slice(
              binariesPage * binariesPerPage,
              binariesPage * binariesPerPage + binariesPerPage,
            ),
          );
        } else {
          setError("Repository are not sync between platforms");
        }
      }
    }

    if (auth.repositories) {
      setListRepo(auth.repositories);
    }

    if (currentRepo) {
      Status().catch((err) => {
        setError(err.rawMessage);
      });
    }
  }, [currentRepo]);

  const uploadFile = () => {
    const formData = new FormData();
    formData.append("file", files[0]);
    fetch(`https://api.marlin-atlas.ts.net/file/${files[0].name}`, {
      method: "POST",
      body: formData,
    }).catch((err) => {
      setError(err);
    });
  };

  const RegisterPackages = () => {
    setError("");
    selectedPackagesValues.forEach((pack) => {
      registerPackage(client, currentRepo, pack, platforms).catch((err) => {
        setError(err.rawMessage);
      });
    });
    setSelectedPackages([]);
    setSelectedPackagesValues([]);
    setCanBePublished([]);
  };

  const UnregisterPackages = () => {
    setError("");
    selectedPackagesValues.forEach((pack) => {
      unregisterPackage(client, currentRepo, pack, platforms).catch((err) => {
        setError(err.rawMessage);
      });
    });
    setSelectedPackages([]);
    setSelectedPackagesValues([]);
    setCanBePublished([]);
  };

  const DeleteVersion = () => {
    setError("");
    selectedVersions.forEach((version) => {
      unregisterVersion(client, currentRepo, version, platforms).catch(
        (err) => {
          setError(err.rawMessage);
        },
      );
    });
  };

  const DeletePackages = () => {
    setError("");
    selectedPackages.forEach((row) => {
      if (listPackages[row].published) {
        unregisterPackage(
          client,
          currentRepo,
          listPackages[row].name,
          platforms,
        ).catch((err) => {
          setError(err.rawMessage);
        });
      }
      fileToDelete(client, listPackages[row].name, platforms).catch((err) => {
        setError(err.rawMessage);
      });
      setSelectedPackages([]);
    });
  };

  const versionsSelection = (id: number, version: string) => {
    const selectedIndex = selectedVersions.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedVersions, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedVersions.slice(1));
    } else if (selectedIndex === selectedVersions.length - 1) {
      newSelected = newSelected.concat(selectedVersions.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedVersions.slice(0, selectedIndex),
        selectedVersions.slice(selectedIndex + 1),
      );
    }

    setSelectedVersions(newSelected);

    if (newSelected.includes(id)) {
      setSelectedVersionsValues((previous_version) => [
        ...previous_version,
        version.revision,
      ]);
    } else {
      const updatedVersions = selectedVersions.filter(
        (ver) => ver !== version.revision,
      );
      setSelectedVersionsValues(updatedVersions);
    }
  };

  const packagesSelection = (id: number, pack: string, published: boolean) => {
    const selectedIndex = selectedPackages.indexOf(id);
    let newSelected: readonly number[] = [];
    let newPublished: readonly boolean[] = [];
    let packagesValues: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedPackages, id);
      packagesValues = packagesValues.concat(selectedPackagesValues, pack);
      newPublished = newPublished.concat(canBePublished, published);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedPackages.slice(1));
      packagesValues = packagesValues.concat(selectedPackagesValues.slice(1));
      newPublished = newPublished.concat(canBePublished.slice(1));
    } else if (selectedIndex === selectedPackages.length - 1) {
      newSelected = newSelected.concat(selectedPackages.slice(0, -1));
      packagesValues = packagesValues.concat(
        selectedPackagesValues.slice(0, -1),
      );
      newPublished = newPublished.concat(canBePublished.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedPackages.slice(0, selectedIndex),
        selectedPackages.slice(selectedIndex + 1),
      );
    }

    setSelectedPackages(newSelected);
    setCanBePublished(newPublished);
    setSelectedPackagesValues(packagesValues);
  };

  let speedupdatecomponent;

  if (!currentRepo) {
    speedupdatecomponent = (
      <div>
        {listRepo.length > 0
          ? listRepo.map((repo, index) => {
              const [repo_name] = repo.keys();
              const platforms = repo.get(repo_name);
              return (
                <Button
                  key={index}
                  variant="contained"
                  onClick={() => {
                    isInit(client, repo_name, platforms)
                      .then(() => {
                        console.log("12: ", repo_name);
                        setCurrentRepo(repo_name);
                        localStorage.setItem("current_repo", repo_name);
                      })
                      .catch((err) => {
                        console.log(err);
                        setError(err.rawMessage);
                      });
                  }}
                >
                  {repo_name}
                </Button>
              );
            })
          : null}
        <Grid item xs={1}>
          <TextField
            id="join-update-server"
            label="path"
            onChange={(e: any) => {
              setPath(e.currentTarget.value);
            }}
          />
          <Button variant="contained">Join repository</Button>
          <TextField
            id="outlined-required"
            label="path"
            value={path}
            onChange={(e: any) => {
              setPath(e.currentTarget.value);
              localStorage.setItem("path", e.currentTarget.value);
            }}
          />
          <FormGroup>
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
          <Button
            variant="contained"
            onClick={() => {
              setError("");
              init(client, path, checked)
                .then(() => {
                  const hostsEnum = getPlatforms();
                  const hosts = Object.keys(checked).filter(
                    (key) => checked[key] === true,
                  );
                  setPlatforms(hosts);
                  setCurrentRepo(path);
                  setPlatformsEnum(hostsEnum);
                  localStorage.setItem("current_repo", path);
                  localStorage.setItem(
                    "platformsEnum",
                    JSON.stringify(hostsEnum),
                  );
                  //localStorage.setItem("platforms", JSON.stringify(hosts));
                  isInit(client, path, hosts)
                    .then(() => {
                      let hosts = getPlatforms();
                      registerUpdateServer(
                        lucleClient,
                        auth.username,
                        path,
                        hosts,
                      ).catch((error) => {
                        setError(err.rawMessage);
                      });
                    })
                    .catch((err) => {
                      setError(err.rawMessage);
                    });
                })
                .catch((err) => {
                  setError(err.rawMessage);
                });
              listRepositories(lucleClient, auth.username).then((list) => {
                setListRepo(list);
              });
            }}
          >
            Create new repository
          </Button>
        </Grid>
        <p>{error}</p>
      </div>
    );
  } else if (currentRepo) {
    speedupdatecomponent = (
      <Box sx={{ width: "100%" }}>
        <Paper sx={{ width: "100%", mb: 2 }}>
          <p>Current version: {currentVersion}</p>
          Total packages size : {size + DisplaySizeUnit(size)}
          <p>
            {error !== "" ? (
              <div>
                <WarningIcon />
                {error}
              </div>
            ) : null}
            <IconButton
              size="large"
              onClick={() => {
                setError("");
                setCurrentRepo("");
                setPlatformsEnum([]);
                setPlatforms([]);
                localStorage.removeItem("platformsEnum");
                localStorage.removeItem("platforms");
                localStorage.removeItem("current_repo");
              }}
            >
              <ExitToAppIcon />
            </IconButton>
          </p>
        </Paper>
        <Paper sx={{ width: "100%", mb: 2 }}>
          <Toolbar
            sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              ...(numVersionsSelected > 0 && {
                bgcolor: (theme) =>
                  alpha(
                    theme.palette.primary.main,
                    theme.palette.action.activatedOpacity,
                  ),
              }),
            }}
          >
            {numVersionsSelected > 0 ? (
              <Typography
                sx={{ flex: "1 1 100%" }}
                color="inherit"
                variant="subtitle1"
                component="div"
              >
                {numVersionsSelected} selected
              </Typography>
            ) : (
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant="h6"
                a
                id="tableTitle"
                component="div"
              >
                Versions
              </Typography>
            )}
            {numVersionsSelected === 1 ? (
              <Tooltip title="SetVersion">
                <IconButton
                  onClick={() => {
                    setError("");
                    setCurrentVersion(
                      client,
                      currentRepo,
                      selectedVersionsValues[0],
                      platforms,
                    )
                      .then(() => {
                        setSelectedVersions([]);
                        setSelectedVersionsValues([]);
                      })
                      .catch((err) => {
                        setError(err.rawMessage);
                      });
                  }}
                >
                  <CheckIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            {numVersionsSelected > 0 ? (
              <Tooltip title="Delete">
                <IconButton onClick={DeleteVersion}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </Toolbar>
          <TableContainer>
            <Table sx={{ width: "100%" }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Revision</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleVersions
                  ? visibleVersions.map((current_version: any, index) => {
                      const isItemSelected = isVersionsSelected(index + 1);
                      const labelId = `enhanced-table-checkbox-${index}`;
                      return (
                        <TableRow
                          hover
                          onClick={() => {
                            versionsSelection(index + 1, current_version);
                          }}
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          key={index + 1}
                          selected={isItemSelected}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              inputProps={{
                                "aria-labelledby": labelId,
                              }}
                            />
                          </TableCell>
                          <TableCell>{current_version.revision}</TableCell>
                          <TableCell>{current_version.description}</TableCell>
                        </TableRow>
                      );
                    })
                  : null}
                <TableRow>
                  <TableCell colSpan={3}>
                    <Grid container spacing={0}>
                      <Grid item xs={4}>
                        <TextField
                          required
                          id="input-with-icon-textfield"
                          label="New version"
                          value={version}
                          onChange={(e: any) => {
                            setVersion(e.currentTarget.value);
                          }}
                          variant="standard"
                        />
                      </Grid>
                      <Grid item xs={7}>
                        <TextField
                          id="description"
                          label="Description"
                          variant="standard"
                          value={description}
                          onChange={(event) => {
                            setDescription(event.currentTarget.value);
                          }}
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton
                          onClick={() => {
                            setError("");
                            registerVersion(
                              client,
                              currentRepo,
                              version,
                              description,
                              platforms,
                            ).catch((err) => {
                              setError(err.rawMessage);
                            });
                            setVersion("");
                            setDescription("");
                          }}
                        >
                          <AddCircleIcon fontSize="large" color="success" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          {listVersions ? (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={listVersions.length}
              rowsPerPage={versionsPerPage}
              page={versionsPage}
              labelRowsPerPage="Versions per page"
              onPageChange={(_, newPage) => {
                setVersionsPage(newPage);
              }}
              onRowsPerPageChange={(event) => {
                setVersionsPerPage(parseInt(event.target.value, 10));
                setVersionsPage(0);
              }}
            />
          ) : null}
        </Paper>
        <Box sx={{ width: "100%" }}>
          <Paper sx={{ width: "100%", mb: 2 }}>
            <Toolbar
              sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                ...(numPackagesSelected > 0 && {
                  bgcolor: (theme) =>
                    alpha(
                      theme.palette.primary.main,
                      theme.palette.action.activatedOpacity,
                    ),
                }),
              }}
            >
              {numPackagesSelected > 0 ? (
                <Typography
                  sx={{ flex: "1 1 100%" }}
                  color="inherit"
                  variant="subtitle1"
                  component="div"
                >
                  {numPackagesSelected} selected
                </Typography>
              ) : (
                <Typography
                  sx={{ flex: "1 1 100%" }}
                  variant="h6"
                  id="tableTitle"
                  component="div"
                >
                  Packages
                </Typography>
              )}
              {numPackagesSelected > 0 && !canBePublished.includes(false) ? (
                <Tooltip title="Unpublish">
                  <IconButton
                    onClick={() => {
                      UnregisterPackages();
                    }}
                  >
                    <UnpublishedIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
              {numPackagesSelected > 0 && !canBePublished.includes(true) ? (
                <Tooltip title="Publish">
                  <IconButton
                    onClick={() => {
                      RegisterPackages();
                    }}
                  >
                    <PublishIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
              {numPackagesSelected > 0 ? (
                <Tooltip title="Delete">
                  <IconButton onClick={DeletePackages}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Toolbar>
            <TableContainer>
              <Table sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Name</TableCell>
                    <TableCell>Published</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visiblePackages
                    ? visiblePackages.map((pack, index) => {
                        const isItemSelected = isPackagesSelected(index);
                        const labelId = `enhanced-table-checkbox-${index}`;
                        return (
                          <TableRow
                            hover
                            onClick={() => {
                              packagesSelection(
                                index,
                                pack.name,
                                pack.published,
                              );
                            }}
                            role="checkbox"
                            aria-checked={isItemSelected}
                            tabIndex={-1}
                            key={index}
                            selected={isItemSelected}
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                color="primary"
                                checked={isItemSelected}
                                inputProps={{
                                  "aria-labelledby": labelId,
                                }}
                              />
                            </TableCell>
                            <TableCell>{pack.name}</TableCell>
                            <TableCell>{pack.published.toString()}</TableCell>
                          </TableRow>
                        );
                      })
                    : null}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={listPackages.length}
              rowsPerPage={packagesPerPage}
              page={packagesPage}
              labelRowsPerPage="Packages per page"
              onPageChange={(event, newPage) => {
                setPackagesPage(newPage);
              }}
              onRowsPerPageChange={(event) => {
                setPackagesPerPage(parseInt(event.target.value, 10));
                setPackagesPage(0);
              }}
            />
          </Paper>
        </Box>
        <Box>
          <Paper sx={{ width: "100%", mb: 2 }}>
            <Toolbar
              sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                ...(numBinariesSelected > 0 && {
                  bgcolor: (theme) =>
                    alpha(
                      theme.palette.primary.main,
                      theme.palette.action.activatedOpacity,
                    ),
                }),
              }}
            >
              {numBinariesSelected > 0 ? (
                <Typography
                  sx={{ flex: "1 1 100%" }}
                  color="inherit"
                  variant="subtitle1"
                  component="div"
                >
                  {numBinariesSelected} selected
                </Typography>
              ) : (
                <Typography
                  sx={{ flex: "1 1 100%" }}
                  variant="h6"
                  id="tableTitle"
                  component="div"
                >
                  Binaries
                </Typography>
              )}
              {numBinariesSelected > 0 ? (
                <Tooltip title="Delete">
                  <IconButton>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Toolbar>
            <TableContainer>
              <Table sx={{ width: "100%" }}>
                {visibleBinaries
                  ? visibleBinaries.map((binary, index) => {
                      const isItemSelected = isBinariesSelected(index + 1);
                      const labelId = `enhanced-table-checkbox-${index}`;
                      return (
                        <TableRow
                          hover
                          // onClick={() =>
                          //  versionsSelection(index + 1, current_version)
                          // }
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          key={index + 1}
                          selected={isItemSelected}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              inputProps={{
                                "aria-labelledby": labelId,
                              }}
                            />
                          </TableCell>
                          <TableCell>{binary}</TableCell>
                        </TableRow>
                      );
                    })
                  : null}
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={availableBinaries.length}
              rowsPerPage={binariesPerPage}
              page={binariesPage}
              onPageChange={(event, newPage) => {
                setBinariesPage(newPage);
              }}
              onRowsPerPageChange={(event) => {
                setBinariesPerPage(parseInt(event.target.value, 10));
                setBinariesPage(0);
              }}
            />
          </Paper>
        </Box>
        Upload Binaries
        <DropzoneArea
          fileObjects={fileObjects}
          onChange={(files) => {
            setFiles(files);
          }}
        />
        <Button
          color="primary"
          sx={{
            position: "absolute",
            right: "0",
          }}
          onClick={uploadFile}
        >
          Submit
        </Button>
      </Box>
    );
  }
  return <div> {speedupdatecomponent} </div>;
}

export default Speedupdate;
