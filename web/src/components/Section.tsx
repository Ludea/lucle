import { ReactNode } from "react";

import Box from '@mui/material/Box';
import { useLayout, useIsMobile } from 'utils/hook';

interface SectionProps {
  id?: string;
  children: ReactNode;
}

export default function Section({ id, children }: SectionProps) {
  const layout = useLayout();
  const isMobile = useIsMobile();

  return (
    <Box
      id={id}
      component="section"
      sx={{
        py: `${layout.sectionPadding}px`,
        px: `${isMobile ? layout.mobilePadding : layout.desktopPadding}px`,
        maxWidth: layout.maxWidth,
        mx: 'auto',
      }}
    >
      {children}
    </Box>
  );
}