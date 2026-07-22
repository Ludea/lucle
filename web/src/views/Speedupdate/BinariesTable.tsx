import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TablePagination from "@mui/material/TablePagination";

function BinariesTable({ availableBinaries }: { availableBinaries: string[] }) {
  const [binariesPerPage, setBinariesPerPage] = useState(5);
  const [binariesPage, setBinariesPage] = useState(0);
  const [selectedBinaries, setSelectedBinaries] = useState<readonly number[]>(
    [],
  );
  const numBinariesSelected = selectedBinaries.length;

  const visibleBinaries = useMemo(
    () =>
      !availableBinaries.length
        ? availableBinaries.slice(
            binariesPage * binariesPerPage,
            binariesPage * binariesPerPage + binariesPerPage,
          )
        : null,
    [availableBinaries, binariesPage, binariesPerPage],
  );

  return (
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
  );
}

export default BinariesTable;
