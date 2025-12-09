import { useEffect, useRef } from "react";

// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Kit 2 React components
import Box from "components/Box";
import Typography from "components/Typography";
import SocialButton from "components/SocialButton";

// Material Kit 2 React examples
import FilledInfoCard from "components/Cards/FilledInfoCard";

// Presentation page sections
import Counters from "components/Counters";
import Information from "components/Information";
import DesignBlocks from "components/DesignBlocks";
import Pages from "components/Pages";
import Testimonials from "components/Testimonials";
import Download from "components/Download";

// Presentation page components
import BuiltByDevelopers from "components/BuiltByDevelopers";

// Images
import bgImage from "assets/images/bg-presentation.jpg";

function Landing() {
  const banner = useRef<HTMLDivElement>();

  const atOptions = {
    key: import.meta.env.VITE_ST_KEY,
    format: "iframe",
    height: 10,
    width: 320,
    params: {},
  };

  useEffect(() => {
    const conf = document.createElement("script");
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = import.meta.env.VITE_ST_SRC + `/${atOptions.key}/invoke.js`;
    conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`;

    if (banner.current) {
      banner.current.append(conf);
      banner.current.append(script);
    }
  }, [banner]);

  return (
    <>
      <Box
        minHeight="75vh"
        width="100%"
        sx={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "top",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Container>
          <Grid
            container
            size={{ xs: 12, lg: 7 }}
            justifyContent="center"
            mx="auto"
          >
            <Typography
              variant="h1"
              color="white"
              mt={-6}
              mb={1}
              sx={({ breakpoints, typography: { size } }) => ({
                [breakpoints.down("md")]: {
                  fontSize: size["3xl"],
                },
              })}
            >
              Material Kit 2 React{" "}
            </Typography>
            <Typography
              variant="body1"
              color="white"
              textAlign="center"
              px={{ xs: 6, lg: 12 }}
              mt={1}
            >
              Free & Open Source Web UI Kit built over ReactJS &amp; MUI. Join
              over 1.6 million developers around the world.
            </Typography>
          </Grid>
        </Container>
      </Box>
      <div
        className="mx-2 my-5 border border-gray-200 justify-center items-center text-white text-center"
        ref={banner}
      ></div>
      <div id={`container-"${import.meta.env.VITE_ST_KEY}`}></div>
      <Card
        sx={{
          p: 2,
          mx: { xs: 2, lg: 3 },
          mt: -8,
          mb: 4,
          backgroundColor: ({ palette: { white }, functions: { rgba } }) =>
            rgba(white.main, 0.8),
          backdropFilter: "saturate(200%) blur(30px)",
          boxShadow: ({ boxShadows: { xxl } }) => xxl,
        }}
      >
        <Counters />
        <Information />
        <DesignBlocks />
        <Pages />
        <Container sx={{ mt: 6 }}>
          <BuiltByDevelopers />
        </Container>
        <Container>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <FilledInfoCard
                variant="gradient"
                color="info"
                icon="flag"
                title="Getting Started"
                description="Check the possible ways of working with our product and the necessary files for building your own project."
                action={{
                  type: "external",
                  route:
                    "https://www.creative-tim.com/learning-lab/react/overview/material-kit/",
                  label: "Let's start",
                }}
              />
            </Grid>
            <Grid size={{ size: 12, lg: 4 }}>
              <FilledInfoCard
                color="info"
                icon="precision_manufacturing"
                title="Plugins"
                description="Get inspiration and have an overview about the plugins that we used to create the Material Kit."
                action={{
                  type: "external",
                  route:
                    "https://www.creative-tim.com/learning-lab/react/overview/datepicker/",
                  label: "Read more",
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <FilledInfoCard
                color="info"
                icon="apps"
                title="Components"
                description="Material Kit is giving you a lot of pre-made components, that will help you to build UI's faster."
                action={{
                  type: "external",
                  route:
                    "https://www.creative-tim.com/learning-lab/react/alerts/material-kit/",
                  label: "Read more",
                }}
              />
            </Grid>
          </Grid>
        </Container>
        <Testimonials />
        <Download />
        <Box pt={18} pb={6}>
          <Container>
            <Grid container spacing={3}>
              <Grid
                size={{ xs: 12, lg: 5, ml: "auto" }}
                sx={{ textAlign: { xs: "center", lg: "left" } }}
              >
                <Typography variant="h4" fontWeight="bold" mb={0.5}>
                  Thank you for your support!
                </Typography>
                <Typography variant="body1" color="text">
                  We deliver the best web products
                </Typography>
              </Grid>
              <Grid
                size={{ xs: 12, lg: 5 }}
                my={{ xs: 5, lg: "auto" }}
                mr={{ xs: 0, lg: "auto" }}
                sx={{ textAlign: { xs: "center", lg: "right" } }}
              >
                <SocialButton
                  component="a"
                  href="https://twitter.com/intent/tweet?text=Check%20Material%20Design%20System%20made%20by%20%40CreativeTim%20%23webdesign%20%23designsystem%20%23mui5&amp;url=https%3A%2F%2Fwww.creative-tim.com%2Fproduct%2Fmaterial-kit-react"
                  target="_blank"
                  color="twitter"
                  sx={{ mr: 1 }}
                >
                  <i className="fab fa-twitter" />
                  &nbsp;Tweet
                </SocialButton>
                <SocialButton
                  component="a"
                  href="https://www.facebook.com/sharer/sharer.php?u=https://www.creative-tim.com/product/material-kit-react"
                  target="_blank"
                  color="facebook"
                  sx={{ mr: 1 }}
                >
                  <i className="fab fa-facebook" />
                  &nbsp;Share
                </SocialButton>
                <SocialButton
                  component="a"
                  href="https://www.pinterest.com/pin/create/button/?url=https://www.creative-tim.com/product/material-kit-react"
                  target="_blank"
                  color="pinterest"
                >
                  <i className="fab fa-pinterest" />
                  &nbsp;Pin it
                </SocialButton>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Card>
    </>
  );
}

export default Landing;
