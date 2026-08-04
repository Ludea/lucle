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
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import { alpha } from "@mui/material/styles";

// Icons
import DeleteIcon from "@mui/icons-material/Delete";

import { ConnectError } from "@connectrpc/connect";

// api
import { fileToDelete } from "utils/speedupdaterpc";

function BinariesTable({
  client,
  currentRepo,
  availableBinaries,
  onError,
}: {
  client: unknown;
  currentRepo: Map<string, string[]>;
  availableBinaries: string[];
  onError: (error: string | null) => void;
}) {
  const [binariesPerPage, setBinariesPerPage] = useState(5);
  const [binariesPage, setBinariesPage] = useState(0);
  const [selectedBinaries, setSelectedBinaries] = useState<readonly number[]>([]);
  const [selectedBinariesValues, setSelectedBinariesValues] = useState<readonly string[]>([]);

  const isBinarySelected = (id: number) => selectedBinaries.includes(id);
  const numBinariesSelected = selectedBinaries.length;

  const visibleBinaries = useMemo(
    () =>
      availableBinaries.length
        ? availableBinaries.slice(
            binariesPage * binariesPerPage,
            binariesPage * binariesPerPage + binariesPerPage,
          )
        : null,
    [availableBinaries, binariesPage, binariesPerPage],
  );

  const binariesSelection = (id: number, bin: string) => {
    const selectedIndex = selectedBinaries.indexOf(id);
    let newSelected: readonly number[] = [];
    let binariesValues: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedBinaries, id);
      binariesValues = binariesValues.concat(selectedBinariesValues, bin);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedBinaries.slice(1));
      binariesValues = binariesValues.concat(selectedBinariesValues.slice(1));
    } else if (selectedIndex === selectedBinaries.length - 1) {
      newSelected = newSelected.concat(selectedBinaries.slice(0, -1));
      binariesValues = binariesValues.concat(selectedBinariesValues.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedBinaries.slice(0, selectedIndex),
        selectedBinaries.slice(selectedIndex + 1),
      );
      binariesValues = binariesValues.concat(
        selectedBinariesValues.slice(0, selectedIndex),
        selectedBinariesValues.slice(selectedIndex + 1),
      );
    }

    setSelectedBinaries(newSelected);
    setSelectedBinariesValues(binariesValues);
  };

  const DeleteBinaries = () => {
    onError(null);
    const repo_name = currentRepo.keys().next().value as string;
    const platforms = currentRepo.get(repo_name);
    selectedBinariesValues.forEach((bin) => {
      fileToDelete(client, bin, platforms, "game").catch((err: ConnectError) => {
        onError(err.rawMessage);
      });
    });
    setSelectedBinaries([]);
    setSelectedBinariesValues([]);
  };

  return (
    <Box>
      <Paper sx={{ width: "100%", mb: 2 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(numBinariesSelected > 0 && {
              bgcolor: (theme) =>
                alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
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
            <Typography sx={{ flex: "1 1 100%" }} variant="h6" id="tableTitle" component="div">
              Binaries
            </Typography>
          )}
          {numBinariesSelected > 0 ? (
            <Tooltip title="Delete">
              <IconButton onClick={DeleteBinaries}>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleBinaries
                ? visibleBinaries.map((binary, index) => {
                    const isItemSelected = isBinarySelected(index + 1);
                    const labelId = `enhanced-table-checkbox-${index}`;
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        aria-checked={isItemSelected}
                        onClick={() => {
                          binariesSelection(index + 1, binary);
                        }}
                        tabIndex={-1}
                        key={index + 1}
                        selected={isItemSelected}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            slotProps={{
                              input: {
                                "aria-labelledby": labelId,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>{binary}</TableCell>
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
  );
}

export default BinariesTable;
