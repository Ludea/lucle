import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

import type { DBInfos } from "layouts/Install";

function DatabaseInfo({
  dbInfos,
  setDBInfos,
}: {
  dbInfos: DBInfos | undefined;
  setDBInfos: (infos: DBInfos) => void;
}) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    setDBInfos({
      ...dbInfos,
      [id]: id === "port" ? Number(value) : value,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        fullWidth
        id="dbName"
        label="Database name"
        slotProps={{ htmlInput: { style: { fontSize: 16 } } }}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        required
        id="hostname"
        label="Hostname"
        slotProps={{ htmlInput: { style: { fontSize: 16 } } }}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        required
        id="port"
        label="Port"
        type="number"
        slotProps={{ htmlInput: { style: { fontSize: 16 }, min: 1, max: 65535 } }}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        required
        id="username"
        label="Username"
        autoComplete="username"
        slotProps={{ htmlInput: { style: { fontSize: 16 } } }}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        required
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        slotProps={{ htmlInput: { style: { fontSize: 16 } } }}
        onChange={handleChange}
      />
    </Box>
  );
}

export default DatabaseInfo;
