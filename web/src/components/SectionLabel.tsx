import { ReactNode } from "react";

import Typography from '@mui/material/Typography';

export default function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography variant="overline" color="primary" display="block" sx={{ mb: 2 }}>
      {children}
    </Typography>
  );
}