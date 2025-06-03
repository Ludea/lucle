/*
=========================================================
* Material Kit 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-kit-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import MuiLink from "@mui/material/Link";

// Material Kit 2 React components
import Box from "components/Box";
import Typography from "components/Typography";
import Button from "components/Button";

function RotatingCard({ color = "info", image, title, description, action }) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      borderRadius="lg"
      coloredShadow={color}
      position="absolute"
      width="100%"
      height="100%"
      top={0}
      left={0}
      zIndex={5}
      sx={{
        backgroundImage: ({
          palette: { gradients },
          functions: { linearGradient, rgba },
        }) =>
          `${linearGradient(
            rgba(
              gradients[color] ? gradients[color].main : gradients.info.main,
              0.85,
            ),
            rgba(
              gradients[color] ? gradients[color].main : gradients.info.main,
              0.85,
            ),
          )}, url(${image})`,
        backgroundSize: "cover",
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      }}
    >
      <Box pt={12} pb={2} px={2} textAlign="center" lineHeight={1}>
        <Typography variant="h3" color="white" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="white" opacity={0.8}>
          {description}
        </Typography>
        {action && (
          <Box width="50%" mt={4} mb={2} mx="auto">
            {action.type === "external" ? (
              <Button
                component={MuiLink}
                href={action.route}
                target="_blank"
                rel="noreferrer"
                color="white"
                size="small"
                fullWidth
              >
                {action.label}
              </Button>
            ) : (
              <Button
                component={Link}
                to={action.route}
                color="white"
                size="small"
                fullWidth
              >
                {action.label}
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default RotatingCard;
