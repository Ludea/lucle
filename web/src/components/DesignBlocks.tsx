// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

// Material Kit 2 React components
import Box from "components/Box";
import Badge from "components/Badge";
import Typography from "components/Typography";

// Presentation page components
import Card from "components/Cards/Card";

// Data
import data from "components/data/designBlocksData";

function DesignBlocks() {
  const renderData = data.map(({ title, description, items }) => (
    <Grid container spacing={3} sx={{ mb: 10 }} key={title}>
      <Grid item xs={12} lg={3}>
        <Box position="sticky" top="100px" pb={{ xs: 2, lg: 6 }}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            {title}
          </Typography>
          <Typography
            variant="body2"
            fontWeight="regular"
            color="secondary"
            mb={1}
            pr={2}
          >
            {description}
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} lg={9}>
        <Grid container spacing={3}>
          {items.map(({ image, name, count, route, pro }) => (
            <Grid item xs={12} md={4} sx={{ mb: 2 }} key={name}>
              <Link to={pro ? "/" : route}>
                <Card image={image} name={name} count={count} pro={pro} />
              </Link>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  ));

  return (
    <Box component="section" my={6} py={6}>
      <Container>
        <Grid
          container
          item
          xs={12}
          lg={6}
          flexDirection="column"
          alignItems="center"
          sx={{ textAlign: "center", my: 6, mx: "auto", px: 0.75 }}
        >
          <Badge
            variant="contained"
            color="info"
            badgeContent="Infinite combinations"
            container
            sx={{ mb: 2 }}
          />
          <Typography variant="h2" fontWeight="bold">
            Huge collection of sections
          </Typography>
          <Typography variant="body1" color="text">
            We have created multiple options for you to put together and
            customise into pixel perfect pages.
          </Typography>
        </Grid>
      </Container>
      <Container sx={{ mt: 6 }}>{renderData}</Container>
    </Box>
  );
}

export default DesignBlocks;
