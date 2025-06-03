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

// @mui material components
import Icon from "@mui/material/Icon";

// Material Kit 2 React components
import Box from "components/Box";
import Typography from "components/Typography";

function RotatingCardFront({
  color = "info",
  image,
  icon = "",
  title,
  description,
}) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignContent="center"
      borderRadius="lg"
      coloredShadow={color}
      width="100%"
      position="relative"
      zIndex={2}
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
      }}
    >
      <Box py={12} px={3} textAlign="center" lineHeight={1}>
        {icon && (
          <Typography variant="h2" color="white" my={2}>
            {typeof icon === "string" ? <Icon>{icon}</Icon> : icon}
          </Typography>
        )}
        <Typography variant="h3" color="white" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="white" opacity={0.8}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

export default RotatingCardFront;
