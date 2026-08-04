import { ReactNode } from "react";

import Typography from "@mui/material/Typography";

export default function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography variant="overline" color="primary" sx={{ display: "block", mb: 2 }}>
      {children}
    </Typography>
  );
}
