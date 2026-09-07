import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";

import DatabaseInfo from "components/DatabaseInfo";
import type { DBInfos } from "layouts/Install";

interface CreateDBProps {
  selectedDB: number;
  setSelectedDB: (dbType: number) => void;
  dbInfos: DBInfos | undefined;
  setDBInfos: (infos: DBInfos) => void;
}

const DB_OPTIONS = [
  { value: 0, label: "MySQL" },
  { value: 1, label: "PostgreSQL" },
  { value: 2, label: "SQLite" },
  { value: 3, label: "SurrealDB" },
];

const SQLITE_DB = 2;

export default function CreateDB({
  selectedDB,
  setSelectedDB,
  dbInfos,
  setDBInfos,
}: CreateDBProps) {
  const handleChange = (event: SelectChangeEvent<number>) => {
    setSelectedDB(Number(event.target.value));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        Select the database engine Lucle will use to store its data.
      </Typography>

      <FormControl fullWidth>
        <InputLabel id="select-database-label">Database engine</InputLabel>
        <Select<number>
          labelId="select-database-label"
          id="select-database"
          value={selectedDB}
          label="Database engine"
          onChange={handleChange}
        >
          {DB_OPTIONS.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedDB === SQLITE_DB ? (
        <TextField
          id="sqlite-db-path"
          label="Database file path"
          variant="outlined"
          fullWidth
          placeholder="e.g. ./lucle.db"
          slotProps={{ htmlInput: { style: { fontSize: 16 } } }}
          onChange={(e) => setDBInfos({ ...dbInfos, dbName: e.target.value })}
        />
      ) : (
        <DatabaseInfo setDBInfos={setDBInfos} dbInfos={dbInfos} />
      )}
    </Box>
  );
}
