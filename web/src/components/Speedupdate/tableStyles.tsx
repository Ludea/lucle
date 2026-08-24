import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import TableCell from "@mui/material/TableCell";
import Typography from "@mui/material/Typography";

export const SectionCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: `calc(${theme.shape.borderRadius}px * 2)`,
  marginBottom: theme.spacing(2),
  overflow: "hidden",
}));

export const SectionLabel = styled(Typography)(({ theme }) => ({
  fontFamily: "JetBrains Mono, monospace",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: theme.palette.primary.main,
}));

export const MonoCell = styled(TableCell)({
  fontFamily: "JetBrains Mono, monospace",
  fontSize: "0.8rem",
});
