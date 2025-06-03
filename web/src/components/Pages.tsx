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
import data from "components/data/pagesData";

function Pages() {
  const renderData = data.map(({ image, name, route }) => (
    <Grid item xs={12} md={6} sx={{ mb: { xs: 3, lg: 0 } }} key={name}>
      <Link to={route}>
        <Card image={image} name={name} display="grid" minHeight="auto" />
      </Link>
    </Grid>
  ));

  return (
    <Box component="section" py={6}>
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
            badgeContent="boost creativity"
            container
            sx={{ mb: 2 }}
          />
          <Typography variant="h2" fontWeight="bold">
            With our coded pages
          </Typography>
          <Typography variant="body1" color="text">
            The easiest way to get started is to use one of our
            <br /> pre-built example pages.
          </Typography>
        </Grid>
      </Container>
      <Container sx={{ mt: { xs: 8, lg: 16 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={9} sx={{ mt: 3, px: { xs: 0, lg: 8 } }}>
            <Grid container spacing={3}>
              {renderData}
            </Grid>
          </Grid>
          <Grid item xs={12} lg={3}>
            <Box position="sticky" top="100px" pb={{ xs: 2, lg: 6 }}>
              <Typography variant="h3" fontWeight="bold" mb={1}>
                Presentation Pages for Company, Landing Pages, Blogs and Support
              </Typography>
              <Typography
                variant="body2"
                fontWeight="regular"
                color="secondary"
                mb={1}
                pr={2}
              >
                These is just a small selection of the multiple possibitilies
                you have. Focus on the business, not on the design.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Pages;
