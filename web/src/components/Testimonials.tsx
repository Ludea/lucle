// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

// Material Kit 2 React components
import Box from "components/Box";
import Typography from "components/Typography";

// Material Kit 2 React examples
import DefaultReviewCard from "components/Cards/DefaultReviewCard";

// Images
import appleLogo from "assets/images/logos/gray-logos/logo-apple.svg";
import facebookLogo from "assets/images/logos/gray-logos/logo-facebook.svg";
import nasaLogo from "assets/images/logos/gray-logos/logo-nasa.svg";
import vodafoneLogo from "assets/images/logos/gray-logos/logo-vodafone.svg";
import digitalOceanLogo from "assets/images/logos/gray-logos/logo-digitalocean.svg";

function Information() {
  return (
    <Box component="section" py={12}>
      <Container>
        <Grid
          container
          size={{
            xs: 12,
            lg: 6,
          }}
          justifyContent="center"
          sx={{ mx: "auto", textAlign: "center" }}
        >
          <Typography variant="h2">Trusted by over</Typography>
          <Typography variant="h2" color="info" textGradient mb={2}>
            1,679,477+ web developers
          </Typography>
          <Typography variant="body1" color="text" mb={2}>
            Many Fortune 500 companies, startups, universities and governmental
            institutions love Creative Tim&apos;s products.
          </Typography>
        </Grid>
        <Grid container spacing={3} sx={{ mt: 8 }}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <DefaultReviewCard
              name="Nick Willever"
              date="1 day ago"
              review="This is an excellent product, the documentation is excellent and helped me get things done more efficiently."
              rating={5}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <DefaultReviewCard
              color="info"
              name="Shailesh Kushwaha"
              date="1 week ago"
              review="I found solution to all my design needs from Creative Tim. I use them as a freelancer in my hobby projects for fun! And its really affordable, very humble guys !!!"
              rating={5}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <DefaultReviewCard
              name="Samuel Kamuli"
              date="3 weeks ago"
              review="Great product. Helped me cut the time to set up a site. I used the components within instead of starting from scratch. I highly recommend for developers who want to spend more time on the backend!."
              rating={5}
            />
          </Grid>
        </Grid>
        <Divider sx={{ my: 6 }} />
        <Grid container spacing={3} justifyContent="center">
          <Grid size={{ xs: 6, md: 4, lg: 2 }}>
            <Box
              component="img"
              src={appleLogo}
              alt="Apple"
              width="100%"
              opacity={0.6}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4, lg: 2 }}>
            <Box
              component="img"
              src={facebookLogo}
              alt="Facebook"
              width="100%"
              opacity={0.6}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4, lg: 2 }}>
            <Box
              component="img"
              src={nasaLogo}
              alt="Nasa"
              width="100%"
              opacity={0.6}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4, lg: 2 }}>
            <Box
              component="img"
              src={vodafoneLogo}
              alt="Vodafone"
              width="100%"
              opacity={0.6}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4, lg: 2 }}>
            <Box
              component="img"
              src={digitalOceanLogo}
              alt="DigitalOcean"
              width="100%"
              opacity={0.6}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Information;
