import { useState } from "react";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import Button from "@mui/material/Button";

// icons
import AddIcon from "@mui/icons-material/Add";

interface Data {
  id: number;
  username: string;
  email: string;
  role: string;
  createdat: string;
}

const CreateData = (
  id: number,
  username: string,
  email: string,
  role: string,
  createdat: string,
): Data => ({ id, username, email, role, createdat });

function Tables() {
  const [rows, setRows] = useState<Data[]>([]);

  const addRow = (index: any) => {
    setRows((state) => [...state, CreateData(index, " ", " ", " ", " ")]);
  };

  return (
    <div>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => {
          addRow(rows.length + 1);
        }}
      >
        Add record
      </Button>
      <TableContainer>
        <Table sx={{ minWidth: 200 }}>
          <TableHead>
            <TableRow>
              <TableCell>id</TableCell>
              <TableCell>username</TableCell>
              <TableCell>email</TableCell>
              <TableCell>role</TableCell>
              <TableCell>createdAt</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody />
        </Table>
      </TableContainer>
    </div>
  );
}

export default Tables;
