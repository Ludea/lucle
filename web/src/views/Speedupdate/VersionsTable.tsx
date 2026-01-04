import { useState, useMemo } from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TablePagination from "@mui/material/TablePagination";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import IconButton from "@mui/material/IconButton";

//Icons
import AddCircleIcon from "@mui/icons-material/AddCircle";

import { ConnectError } from "@connectrpc/connect";

function VersionsTable({
  listVersions,
  onError,
}: {
  listVersions: string[];
  onError: (rawMessage: string) => void;
}) {
  const [version, setVersion] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [versionsPerPage, setVersionsPerPage] = useState(5);
  const [versionsPage, setVersionsPage] = useState(0);
  const [selectedVersions, setSelectedVersions] = useState<readonly number[]>(
    [],
  );

  const isVersionsSelected = (id: number) => selectedVersions.includes(id);
  const numVersionsSelected = selectedVersions.length;

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

  const DeleteVersion = () => {
    onError(null);
    const repo_name = currentRepo.keys().next().value;
    const platforms = currentRepo.get(repo_name);
    selectedVersionsValues.forEach((version) => {
      unregisterVersion(client, repo_name, version, platforms, "game")
        .then(() => {
          setSelectedVersions([]);
          setSelectedVersionsValues([]);
        })
        .catch((err) => {
          onError(err);
        });
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

  return (
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
                onError(null);
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
                  .catch((err: ConnectError) => {
                    onError(err.rawMessage);
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
                          onError(null);
                          registerVersion(
                            client,
                            repo_name,
                            version,
                            description,
                            platforms,
                            "game",
                          ).catch((err: ConnectError) => {
                            onError(err.rawMessage);
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
                          onError(null);
                          registerVersion(
                            client,
                            repo_name,
                            version,
                            description,
                            platforms,
                            "game",
                          ).catch((err: ConnectError) => {
                            onError(err.rawMessage);
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
                        onError(null);
                        registerVersion(
                          client,
                          repo_name,
                          version,
                          description,
                          platforms,
                          "game",
                        ).catch((err: ConnectError) => {
                          onError(err.rawMessage);
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
  );
}

export default VersionsTable;
