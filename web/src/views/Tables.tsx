import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';

//icons
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CreateIcon from '@mui/icons-material/Create';
import { get, adelete } from 'utils/Api';

interface Data {
  id: number
  username: string
  email: string
  role: string
  createdat: string
};

const CreateData = (id: number, username: string, email: string, role: string, createdat: string): Data => {
  return {id, username, email, role, createdat}
};

const Tables = () => {
  const [rows, setRows] = useState<Data[]>([]);
  const [editing, setEditing] = useState<Boolean>(false)
  const [editingIndex, setEditingIndex] = useState<any>(-1);

  let newData = { username: "", email: "", role: ""};

  const saveNewRow = () => {
    alert("value : " + JSON.stringify(newData) );
  }

  useEffect(() => {
   get("/diesel/table")
   .then((value: any) => {
    for(var i=0; i < value.data.length; i++) {
      setRows(state => [...state,  CreateData(value.data[i].id, value.data[i].username, value.data[i].email, value.data[i].role, value.data[i].createdat) ]) ;
    }
   })
   .catch((value) => {
     alert("error : " + value);
   });
},[setRows])

  const addRow = (index: any) => {
    setRows(state => [...state,  CreateData(index, " ", " ", " ", " ") ]);
    setEditingIndex(index);
  };

  return(
    <div>
      <Button 
	color="primary" 
	startIcon={<AddIcon />}
	onClick={() => addRow(rows.length + 1)}
      >
        Add record
      </Button>
      <TableContainer>
          <Table
            sx={{ minWidth: 200 }}>
            <TableHead>
              <TableRow>
                <TableCell>
                id
                </TableCell>
                <TableCell>
                username
                </TableCell>
                <TableCell>
                email
                </TableCell>
                <TableCell>
                role
                </TableCell>
                <TableCell>
                createdAt
                </TableCell>
		<TableCell>
                Action
                </TableCell>
              </TableRow>
	    </TableHead>
            <TableBody>
	      {rows.map((row: any) => (
		<TableRow
		  key={row.id.toString()}
		>
                <TableCell>
		  { row.id }
                </TableCell>
		<TableCell>
                  { editingIndex === row.id  ? (
		    <TextField 
		      id="newusername"
		      margin="dense"
		      fullWidth
		      variant="outlined"
		      onChange={(event) => newData = { username: event.target.value, email: "", role: "" }}
		    />
		    ) : row.username
		  }
                </TableCell>
		<TableCell>
		  { editingIndex === row.id ? (
                    <TextField 
		      id="newemail" 
		      margin="dense"
		      fullWidth
		      variant="outlined"
		      onChange={(event) => newData = { username: "", email: event.target.value, role: "" }}
                    />
                    ) : row.email
                  }
                  </TableCell>
		  <TableCell>
		    { editingIndex === row.id ? (
                      <div>
		      <FormControl fullWidth>
			<InputLabel 
			  id="demo-simple-select-label"
			>
			role
			</InputLabel>
			<Select
			  labelId="demo-simple-select-label"
			  id="demo-simple-select"
			  label="role"
			  
			>
			  <MenuItem value={"normal"}>normal</MenuItem>
			  <MenuItem value={"admin"}>admin</MenuItem>
			</Select>
		      </FormControl>
		      </div>
		    ) : row.role
		  }
                  </TableCell>
		  <TableCell>
                  {row.createdAt}
                  </TableCell>
		  <TableCell>
		    { editingIndex === row.id ? (
			<div>
			  <IconButton 
			    aria-label="save"
			    onClick={() => alert(JSON.stringify(newData) )}
			  >
                            <SaveIcon />
                          </IconButton>
			  <IconButton aria-label="clear">
                            <ClearIcon />
                          </IconButton>
			</div>
		      ) : (
			<div>
			  <IconButton aria-label="modify">
			    <CreateIcon />
			  </IconButton>
			  <IconButton aria-label="delete">
			    <DeleteIcon 
				onClick={() => adelete('/diesel/' + row.id) }
			    />
			  </IconButton>
			</div>
		      )
		    }
                  </TableCell>
                </TableRow>
              )
	    )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
);
}

export default Tables ;
