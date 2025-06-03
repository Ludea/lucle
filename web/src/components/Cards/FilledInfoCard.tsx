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

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Icon from "@mui/material/Icon";

// Material Kit 2 React components
import Box from "components/Box";
import Typography from "components/Typography";

function DefaultInfoCard({
  color = "info",
  icon,
  title,
  description,
  direction = "left",
  small = false,
}) {
  return (
    <Box
      lineHeight={1}
      p={direction === "center" ? 2 : 0}
      textAlign={direction}
    >
      {typeof icon === "string" ? (
        <Typography
          display="block"
          variant={direction === "center" ? "h2" : "h3"}
          color={color}
          textGradient
        >
          {" "}
          <Icon>{icon}</Icon>{" "}
        </Typography>
      ) : (
        icon
      )}
      <Typography
        display="block"
        variant="5"
        fontWeight="bold"
        mt={direction === "center" ? 1 : 2}
        mb={1.5}
      >
        {title}
      </Typography>
      <Typography
        display="block"
        variant={small ? "button" : "body2"}
        color="text"
        pr={direction === "left" ? 6 : 0}
        pl={direction === "right" ? 6 : 0}
      >
        {description}
      </Typography>
    </Box>
  );
}

export default DefaultInfoCard;
