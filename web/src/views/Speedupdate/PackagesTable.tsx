import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
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

// api
import {
  registerPackage,
  unregisterPackage,
  fileToDelete,
} from "utils/speedupdaterpc";

function PackagesTable({
  client,
  listPackages,
  onError
}: {
  client: PromiseClient<typeof Repo>,
  listPackages: string[],
  onError: (error: string) => void
}) {
  const [packagesPage, setPackagesPage] = useState(0);
  const [packagesPerPage, setPackagesPerPage] = useState(5);
  const [canBePublished, setCanBePublished] = useState<boolean[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<readonly number[]>(
    [],
  );
  const [selectedPackagesValues, setSelectedPackagesValues] = useState<
    string[]
  >([]);
  const isPackagesSelected = (id: number) => selectedPackages.includes(id);
  const numPackagesSelected = selectedPackages.length;

  const visiblePackages = useMemo(
    () =>
      listPackages.length > 0
        ? listPackages.slice(
            packagesPage * packagesPerPage,
            packagesPage * packagesPerPage + packagesPerPage,
          )
        : null,
    [listPackages, packagesPage, packagesPerPage],
  );

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

  const RegisterPackages = () => {
    onError(null);
    const repo_name = currentRepo.keys().next().value;
    const platforms = currentRepo.get(repo_name);
    selectedPackagesValues.forEach((pack) => {
      registerPackage(client, repo_name, pack, platforms, "game").catch(
        (err) => {
          onError(err);
        },
      );
    });
    setSelectedPackages([]);
    setSelectedPackagesValues([]);
    setCanBePublished([]);
  };

  const UnregisterPackages = () => {
    onError(null);
    const repo_name = currentRepo.keys().next().value;
    const platforms = currentRepo.get(repo_name);
    selectedPackagesValues.forEach((pack) => {
      unregisterPackage(client, repo_name, pack, platforms, "game").catch(
        (err) => {
          onError(err.rawMessage);
        },
      );
    });
    setSelectedPackages([]);
    setSelectedPackagesValues([]);
    setCanBePublished([]);
  };

  const DeletePackages = () => {
    onError(null);
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
          onError(err.rawMessage);
        });
      }
      fileToDelete(client, listPackages[row].name, platforms, "game").catch(
        (err) => {
          onError(err.rawMessage);
        },
      );
      setSelectedPackages([]);
    });
  };

  return (
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
                          packagesSelection(index, pack.name, pack.published);
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
  );
}

export default PackagesTable;
