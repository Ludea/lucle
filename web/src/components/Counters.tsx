// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

// Material Kit 2 React components
import Box from "components/Box";

// Material Kit 2 React examples
import DefaultCounterCard from "components/Cards/DefaultCounterCard";

function Counters() {
  return (
    <Box component="section" py={3}>
      <Container>
        <Grid container size={{ xs: 12, lg: 9 }} sx={{ mx: "auto" }}>
          <Grid size={{ xs: 12 }} md={4}>
            <DefaultCounterCard
              count={70}
              suffix="+"
              title="Coded Elements"
              description="From buttons, to inputs, navbars, alerts or cards, you are covered"
            />
          </Grid>
          <Grid size={{ xs: 12 }} md={4} display="flex">
            <Divider
              orientation="vertical"
              sx={{ display: { xs: "none", md: "block" }, mx: 0 }}
            />
            <DefaultCounterCard
              count={15}
              suffix="+"
              title="Design Blocks"
              description="Mix the sections, change the colors and unleash your creativity"
            />
            <Divider
              orientation="vertical"
              sx={{ display: { xs: "none", md: "block" }, ml: 0 }}
            />
          </Grid>
          <Grid size={{ xs: 12 }} md={4}>
            <DefaultCounterCard
              count={4}
              title="Pages"
              description="Save 3-4 weeks of work when you use our pre-made pages for your website"
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Counters;
