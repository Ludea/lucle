/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { forwardRef, createContext, useContext, useMemo } from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// Material Dashboard 2 React components
import Box from "components/Box";

// Custom styles for MDPagination
import PaginationItemRoot from "components/Pagination/PaginationItemRoot";

// The Pagination main context
const Context = createContext();

const Pagination = forwardRef(
  ({ item, variant, color, size, active, children }, ref) => {
    const context = useContext(Context);
    const paginationSize = context ? context.size : null;

    const value = useMemo(
      () => ({ variant, color, size }),
      [variant, color, size],
    );

    return (
      <Context.Provider value={value}>
        {item ? (
          <PaginationItemRoot
            ref={ref}
            variant={active ? context.variant : "outlined"}
            color={active ? context.color : "secondary"}
            iconOnly
            circular
            ownerState={{ variant, active, paginationSize }}
          >
            {children}
          </PaginationItemRoot>
        ) : (
          <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ listStyle: "none" }}
          >
            {children}
          </Box>
        )}
      </Context.Provider>
    );
  },
);

// Setting default values for the props of MDPagination
Pagination.defaultProps = {
  item: false,
  variant: "gradient",
  color: "info",
  size: "medium",
  active: false,
};

// Typechecking props for the MDPagination
Pagination.propTypes = {
  item: PropTypes.bool,
  variant: PropTypes.oneOf(["gradient", "contained"]),
  color: PropTypes.oneOf([
    "white",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  active: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

Pagination.displayName = "Pagination";

export default Pagination;
