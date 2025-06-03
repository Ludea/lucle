// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// react-countup component
import CountUp from "react-countup";

// Material Kit 2 React components
import Box from "components/Box";
import Typography from "components/Typography";

function DefaultCounterCard({
  color = "info",
  count,
  title = "",
  description = "",
}) {
  return (
    <Box p={2} textAlign="center" lineHeight={1}>
      <Typography variant="h1" color={color} textGradient>
        <CountUp end={count} duration={1} />
      </Typography>
      {title && (
        <Typography variant="h5" mt={2} mb={1}>
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" color="text">
          {description}
        </Typography>
      )}
    </Box>
  );
}

export default DefaultCounterCard;
