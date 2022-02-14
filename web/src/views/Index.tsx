import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';

import { get } from 'utils/Api';

interface Data {
  name: string
};

const CreateData = (name: string): Data => {
  return {name}
};

const Index = () => {
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [rows, setRows] = useState<Data[]>([]);

  useEffect(() => {
   get("/diesel/tables")
   .then((value: any) => {
    setRows([ CreateData(value.data)] ) ;
   })
   .catch((value) => {
     alert("error : " + value);
   });
})
 const isSelected = (name: string) => selected.indexOf(name) !== -1;

 const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: readonly string[] = [];
    setSelected(newSelected);
}

  const Deploy = () => {
	alert("allo");
  }
 
  return(
    <div>
    <Button
        variant="contained"
        //onClick={Deploy}
    >
    Create Table
    </Button>
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table
            sx={{ minWidth: 200 }}>
            <TableHead>
	      <TableRow>
	        <TableCell
		  key='table'
	        >
	        Tables
	        </TableCell>
	      </TableRow>
            </TableHead>
            <TableBody>
	      {rows.map((row: any) => {
		const isItemSelected = isSelected(row.name);
                return( 
	          <TableRow
		    hover
		    //key={row.name}
		    onClick={(event: any) => handleClick(event, row.name)}
		    selected={isItemSelected}
	          >
		    <TableCell>
		    {row.name}
		    </TableCell>
	          </TableRow>
	        );
	      })}
	    </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
    <Button 
	variant="contained"
	onClick={Deploy}
    >
    Deploy
    </Button>
    </div>
);
};

export default Index;
