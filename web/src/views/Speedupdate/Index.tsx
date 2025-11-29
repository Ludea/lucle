import { useState, useEffect, useContext, useMemo } from "react";
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
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
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
import { Repo, Platforms, Options, Versions } from "gen/speedupdate_pb";

// api
import {
  registerVersion,
  unregisterVersion,
  setCurrentVersion,
  registerPackage,
  unregisterPackage,
  repoToDelete,
  fileToDelete,
  status,
} from "utils/speedupdaterpc";
import { deleteRepo } from "utils/rpc";

// Context
import { useAuth } from "context/Auth";
import { LucleRPC } from "context/Luclerpc";

// import { uploadFile } from "utils/minio";

const transport = createGrpcWebTransport({
  baseUrl: "https://repo.marlin-atlas.ts.net",
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
};

function Speedupdate() {
  const [key, setKey] = useState();
  const [statusAlreadyStarted, setStatusAlreadyStarted] = useState(false);
  const [uploadProgression, setUploadProgression] = useState();
  const [uploadBinariesHost, setUploadBinariesHost] = useState<number>(0);
  const [currentRepo, setCurrentRepo] = useState<Map<string, string[]>>(
    new Map(),
  );
  const [currentVer, setCurrentVer] = useState<string>("");
  const [size, setSize] = useState<number>();
  const [version, setVersion] = useState<string>();
  const [platformsEnum, setPlatformsEnum] = useState<Platforms[]>(
    JSON.parse(localStorage.getItem("platformsEnum")),
  );
  const [canBePublished, setCanBePublished] = useState<boolean[]>([]);
  const [listPackages, setListPackages] = useState<string[]>([]);
  const [availableBinaries, setAvailableBinaries] = useState<string[]>([]);
  const [listVersions, setListVersions] = useState<any>();
  const [listRepo, setListRepo] = useState<Map<string, string[]>>(new Map());
  const [selectedVersionsValues, setSelectedVersionsValues] = useState<
    string[]
  >([]);
  const [binariesPage, setBinariesPage] = useState(0);
  const [packagesPage, setPackagesPage] = useState(0);
  const [versionsPage, setVersionsPage] = useState(0);
  const [buildPath, setBuildPath] = useState<string>("");
  const [uploadPath, setUploadPath] = useState<string>("");
  const [files, setFiles] = useState();
  const [packagesPerPage, setPackagesPerPage] = useState(5);
  const [versionsPerPage, setVersionsPerPage] = useState(5);
  const [binariesPerPage, setBinariesPerPage] = useState(5);
  const [error, setError] = useState<string | null>(null);
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

  const auth = useAuth();
  const lucleClient = useContext(LucleRPC);
  const controller = new AbortController();

  const isVersionsSelected = (id: number) => selectedVersions.includes(id);
  const numVersionsSelected = selectedVersions.length;

  const isPackagesSelected = (id: number) => selectedPackages.includes(id);
  const numPackagesSelected = selectedPackages.length;

  const isBinariesSelected = (id: number) => selectedBinaries.includes(id);
  const numBinariesSelected = selectedBinaries.length;

  const visibleVersions = useMemo(
    () =>
      listVersions
        ? listVersions.slice(
            versionsPage * versionsPerPage,
            versionsPage * versionsPerPage + versionsPerPage,
          )
        : null,
    [listVersions, versionsPage, versionsPerPage],
  );

  const visiblePackages = useMemo(
    () =>
      listPackages
        ? listPackages.slice(
            packagesPage * packagesPerPage,
            packagesPage * packagesPerPage + packagesPerPage,
          )
        : null,
    [listPackages, packagesPage, packagesPerPage],
  );

  const visibleBinaries = useMemo(
    () =>
      availableBinaries
        ? availableBinaries.slice(
            binariesPage * binariesPerPage,
            binariesPage * binariesPerPage + binariesPerPage,
          )
        : null,
    [availableBinaries, binariesPage, binariesPerPage],
  );

  useEffect(() => {
    const savedCurrentRepo = localStorage.getItem("current_repo");
    if (savedCurrentRepo) {
      const parsedCurrentRepo = JSON.parse(savedCurrentRepo);
      const mapCurrentRepo = new Map();
      mapCurrentRepo.set(
        parsedCurrentRepo.repo_name,
        parsedCurrentRepo.platforms,
      );
      if (currentRepo.size === 0) setCurrentRepo(mapCurrentRepo);
    }

    const opt: Options = {
      buildPath: ".",
      uploadPath: ".",
    };

    if (currentRepo.size > 0) {
      const current = currentRepo.keys().next().value;
      if (!statusAlreadyStarted) {
        status(client, current, platformsEnum, "game", opt).then((value) => {
          const reader = value.getReader();
          setStatusAlreadyStarted(true);
          async function readStream() {
            let result;
            while (!(result = await reader.read()).done) {
              setListVersions(result.value.versions);
              setListPackages(result.value.packages);
              setAvailableBinaries(result.value.binaries);
              setSize(result.value.size);
              setCurrentVer(result.value.currentVersion);
            }
          }
          readStream();
        });

        const eventSource = new EventSource(
          "https://repo.marlin-atlas.ts.net/" +
            current +
            "/game" +
            "/progression",
        );
        eventSource.onmessage = (event) => {
          setUploadProgression(event.data);
          if (event.data === "100") {
            setUploadProgression(null);
            setFiles(null);
          }
        };
        eventSource.onerror = (error) => {
          setError(error);
        };
      }
    }
  }, [currentRepo, visibleVersions]);

  const uploadFile = () => {
    let platform;
    switch (uploadBinariesHost) {
      case 0:
        platform = "win64";
        break;
      case 1:
        platform = "macos_x64_86";
        break;
      case 2:
        platform = "macos_arm64";
        break;
      case 3:
        platform = "linux";
        break;
    }
    const current_repo = currentRepo.keys().next().value;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files[]", files[i]);
    }
    fetch(
      "https://repo.marlin-atlas.ts.net/" +
        current_repo +
        "/binaries" +
        "/" +
        platform,
      {
        method: "POST",
        body: formData,
      },
    )
      .then(() => {
        setFiles([]);
        setKey((prev) => prev + 1);
      })
      .catch((err) => {
        setFiles([]);
        setError(JSON.stringify(err));
      });
  };

  const RegisterPackages = () => {
    setError(null);
    const repo_name = currentRepo.keys().next().value;
    const platforms = currentRepo.get(repo_name);
    selectedPackagesValues.forEach((pack) => {
      registerPackage(client, repo_name, pack, platforms, "game").catch(
        (err) => {
          setError(err);
        },
      );
    });
    setSelectedPackages([]);
    setSelectedPackagesValues([]);
    setCanBePublished([]);
  };

  const UnregisterPackages = () => {
    setError(null);
    const repo_name = currentRepo.keys().next().value;
    const platforms = currentRepo.get(repo_name);
    selectedPackagesValues.forEach((pack) => {
      unregisterPackage(client, repo_name, pack, platforms, "game").catch(
        (err) => {
          setError(err.rawMessage);
        },
      );
    });
    setSelectedPackages([]);
    setSelectedPackagesValues([]);
    setCanBePublished([]);
  };

  const DeleteVersion = () => {
    setError(null);
    const repo_name = currentRepo.keys().next().value;
    const platforms = currentRepo.get(repo_name);
    selectedVersionsValues.forEach((version) => {
      unregisterVersion(client, repo_name, version, platforms, "game")
        .then(() => {
          setSelectedVersions([]);
          setSelectedVersionsValues([]);
        })
        .catch((err) => {
          setError(err);
        });
    });
  };

  const DeletePackages = () => {
    setError(null);
    const repo_name = currentRepo.keys().next().value;
    const platforms = currentRepo.get(repo_name);
    selectedPackages.forEach((row) => {
      if (listPackages[row].published) {
        unregisterPackage(
          client,
          repo_name,
          listPackages[row].name,
          platforms,
          "game",
        ).catch((err) => {
          setError(err.rawMessage);
        });
      }
      fileToDelete(client, listPackages[row].name, platforms, "game").catch(
        (err) => {
          setError(err.rawMessage);
        },
      );
      setSelectedPackages([]);
    });
  };

  const versionsSelection = (id: number, version: Versions) => {
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
      setSelectedVersionsValues((previous_version) =>
        previous_version.filter((ver) => ver !== version.revision),
      );
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

  if (currentRepo.size > 0) {
    speedupdatecomponent = (
      <Box sx={{ width: "100%" }}>
        <Paper sx={{ width: "100%", mb: 2 }}>
          <Grid container>
            <Grid size={12}>
              Current version: {currentVer ? currentVer : "-"}
            </Grid>
            <Grid size={12}>
              Total packages size: {size ? size + DisplaySizeUnit(size) : "-"}
            </Grid>
            Options:
            <Grid size={12}>
              Build path:{" "}
              <TextField
                value={buildPath}
                id="build-path"
                label=""
                variant="standard"
                onChange={(event) => {
                  setBuildPath(event.target.value);
                }}
              />
            </Grid>
            <Grid size={12}>
              Upload path:{" "}
              <TextField
                value={buildPath}
                id="upload-path"
                label=""
                variant="standard"
                onChange={(event) => {
                  setUploadPath(event.target.value);
                }}
              />
            </Grid>
            <Grid size={12}>
              {error !== null ? (
                <div>
                  <WarningIcon />
                  {error}
                </div>
              ) : null}
            </Grid>
            <IconButton
              size="large"
              onClick={() => {
                controller.abort();
                setError(null);
                setCurrentRepo(new Map());
                setPlatformsEnum([]);
                setSelectedVersions([]);
                setSelectedVersionsValues([]);
                localStorage.removeItem("platformsEnum");
                localStorage.removeItem("current_repo");
              }}
            >
              <ExitToAppIcon />
            </IconButton>
            <IconButton
              size="large"
              onClick={() => {
                const path = currentRepo.keys().next().value;
                repoToDelete(client, path)
                  .then(() => {
                    deleteRepo(lucleClient, path)
                      .then(() => {
                        setError(null);
                        setCurrentRepo(new Map());
                        const list = listRepo;
                        list.delete(path);
                        setListRepo(list);
                        setPlatformsEnum([]);
                        localStorage.setItem(
                          "repositories",
                          JSON.stringify(Object.fromEntries(list)),
                        );
                        localStorage.removeItem("platformsEnum");
                        localStorage.removeItem("current_repo");
                      })
                      .catch((err) => {
                        setError(err.rawMessage);
                      });
                  })
                  .catch((err) => {
                    setError(err.rawMessage);
                  });
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
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
                    const repo_name = currentRepo.keys().next().value;
                    const platforms = currentRepo.get(repo_name);
                    setError(null);
                    setCurrentVersion(
                      client,
                      repo_name,
                      selectedVersionsValues[0],
                      platforms,
                      "game",
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
                  ? visibleVersions.map(
                      (current_version: Versions, index: number) => {
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
                      },
                    )
                  : null}
                <TableRow>
                  <TableCell colSpan={3}>
                    <Grid container spacing={0}>
                      <Grid size={4}>
                        <TextField
                          required
                          id="register-version"
                          label="New version"
                          variant="standard"
                          value={version}
                          onChange={(event) => {
                            setVersion(event.target.value);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              const [repo_name] = currentRepo.keys();
                              const platforms = currentRepo.get(repo_name);
                              setError(null);
                              registerVersion(
                                client,
                                repo_name,
                                version,
                                description,
                                platforms,
                                "game",
                              ).catch((err) => {
                                setError(err.rawMessage);
                              });
                              setVersion("");
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={7}>
                        <TextField
                          id="description"
                          label="Description"
                          variant="standard"
                          value={description}
                          onChange={(event) => {
                            setDescription(event.target.value);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              const [repo_name] = currentRepo.keys();
                              const platforms = currentRepo.get(repo_name);
                              setError(null);
                              registerVersion(
                                client,
                                repo_name,
                                version,
                                description,
                                platforms,
                                "game",
                              ).catch((err) => {
                                setError(err.rawMessage);
                              });
                              setVersion("");
                              setDescription("");
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={1}>
                        <IconButton
                          onClick={() => {
                            const [repo_name] = currentRepo.keys();
                            const platforms = currentRepo.get(repo_name);
                            setError(null);
                            registerVersion(
                              client,
                              repo_name,
                              version,
                              description,
                              platforms,
                              "game",
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
              onPageChange={(_, newPage) => {
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
        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="hosts">Hosts</InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            value={uploadBinariesHost}
            onChange={(event) => {
              setUploadBinariesHost(event.target.value);
            }}
            label="Hosts"
          >
            <MenuItem value={0}>Win64</MenuItem>
            <MenuItem value={1}>Macos x86_64</MenuItem>
            <MenuItem value={2}>Macos aarch64</MenuItem>
            <MenuItem value={3}>Linux</MenuItem>
          </Select>
        </FormControl>
        <DropzoneArea
          key={key}
          fileObjects={files}
          onChange={(newFile) => {
            setFiles(newFile);
          }}
        />
        <Grid
          container
          sx={{
            alignItems: "center",
          }}
        >
          <Grid size={9}>
            {uploadProgression ? (
              <LinearProgress variant="determinate" value={uploadProgression} />
            ) : null}
          </Grid>
          <Grid size={1}>
            {!uploadProgression ? (
              <Button color="primary" onClick={uploadFile}>
                Submit
              </Button>
            ) : null}
          </Grid>
        </Grid>
      </Box>
    );
  }
  return <div> {speedupdatecomponent} </div>;
}

export default Speedupdate;
