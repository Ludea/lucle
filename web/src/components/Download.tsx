// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";

// Material Kit 2 React components
import Box from "components/Box";
import Button from "components/Button";
import Typography from "components/Typography";

// Images
import bgImage from "assets/images/shapes/waves-white.svg";

function Download() {
  return (
    <Box component="section" py={{ xs: 0, sm: 12 }}>
      <Box
        variant="gradient"
        bgColor="dark"
        position="relative"
        borderRadius="xl"
        sx={{ overflow: "hidden" }}
      >
        <Box
          component="img"
          src={bgImage}
          alt="pattern-lines"
          position="absolute"
          top={0}
          left={0}
          width="100%"
          zIndex={1}
          opacity={0.2}
        />
        <Container sx={{ position: "relative", zIndex: 2, py: 12 }}>
          <Grid
            container
            size={{
              xs: 12,
              md: 7,
            }}
            justifyContent="center"
            mx="auto"
            textAlign="center"
          >
            <Typography variant="h3" color="white">
              Do you love this awesome
            </Typography>
            <Typography variant="h3" color="white" mb={1}>
              UI Kit for ReactJS &amp; MUI?
            </Typography>
            <Typography variant="body2" color="white" mb={6}>
              Cause if you do, it can be yours for FREE. Hit the button below to
              navigate to Creative Tim where you can find the Design System in
              HTML. Start a new project or give an old Bootstrap project a new
              look!
            </Typography>
            <Button
              variant="gradient"
              color="info"
              size="large"
              component="a"
              href="https://www.creative-tim.com/product/material-kit-react"
              sx={{ mb: 2 }}
            >
              Download Now
            </Button>
          </Grid>
        </Container>
      </Box>
      <Container>
        <Grid container size={{ xs: 6 }} mx="auto">
          <Box textAlign="center">
            <Typography variant="h3" mt={6} mb={3}>
              Available on these technologies
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              <Grid size={{ xs: 4, lg: 2 }}>
                <Tooltip title="Bootstrap 5 - Most popular front-end component library">
                  <Box
                    component="a"
                    href="https://www.creative-tim.com/product/material-kit"
                    target="_blank"
                  >
                    <Box
                      component="img"
                      src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/logos/bootstrap5.jpg"
                      width="100%"
                    />
                  </Box>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 4, lg: 2 }}>
                <Tooltip title="Comming soon">
                  <Box
                    opacity={0.5}
                    component="a"
                    href="#"
                    target="_blank"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Box
                      component="img"
                      src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/logos/icon-tailwind.jpg"
                      width="100%"
                    />
                  </Box>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 4, lg: 2 }}>
                <Tooltip title="Comming soon">
                  <Box
                    opacity={0.5}
                    component="a"
                    href="#"
                    target="_blank"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Box
                      component="img"
                      src="https://s3.amazonaws.com/creativetim_bucket/tim_static_images/presentation-page/vue.jpg"
                      width="100%"
                    />
                  </Box>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 4, lg: 2 }}>
                <Tooltip title="Comming soon">
                  <Box
                    opacity={0.5}
                    component="a"
                    href="#"
                    target="_blank"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Box
                      component="img"
                      src="https://s3.amazonaws.com/creativetim_bucket/tim_static_images/presentation-page/angular.jpg"
                      width="100%"
                    />
                  </Box>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 4, lg: 2 }}>
                <Tooltip title="Comming soon">
                  <Box
                    component="a"
                    href="https://www.creative-tim.com/product/material-kit-react"
                    target="_blank"
                  >
                    <Box
                      component="img"
                      src="https://s3.amazonaws.com/creativetim_bucket/tim_static_images/presentation-page/react.jpg"
                      width="100%"
                    />
                  </Box>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 4, lg: 2 }}>
                <Tooltip title="Comming soon">
                  <Box
                    opacity={0.5}
                    component="a"
                    href="#"
                    target="_blank"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Box
                      component="img"
                      src="https://s3.amazonaws.com/creativetim_bucket/tim_static_images/presentation-page/sketch.jpg"
                      width="100%"
                    />
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
}

export default Download;
