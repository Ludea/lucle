import { Navigate, Outlet } from "react-router-dom";

import Landing from "views/Landing";
import Install from "layouts/Install";
import ForgotPassword from "views/ForgotPassword";
import AdminIndex from "views/AdminIndex";
import Speedupdate from "views/Speedupdate";
import Login from "views/Login";
import Dashboard from "layouts/Dashboard";

import { useAuth } from "context/Auth";

function PrivateRoutes() {
  const user = useAuth();
  return user.token ? <Outlet /> : <Navigate to="/login" replace />;
}

function InstalledRoutes({ isInstalled }: { isInstalled: boolean }) {
  return isInstalled ? <Outlet /> : <Navigate to="/install" replace />;
}

function UninstalledRoutes({ isInstalled }: { isInstalled: boolean }) {
  return isInstalled ? <Navigate to="/" replace /> : <Outlet />;
}

const routes = (isInstalled: boolean) => [
  { path: "/", element: <Landing /> },
  {
    element: <InstalledRoutes isInstalled={isInstalled} />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/forgot", element: <ForgotPassword /> },
      {
        element: <PrivateRoutes />,
        children: [
          {
            path: "admin/*",
            element: <Dashboard />,
            children: [
              { index: true, element: <AdminIndex /> },
              { path: "speedupdate", element: <Speedupdate /> },
              // { path: "tables", element: <Tables /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <UninstalledRoutes isInstalled={isInstalled} />,
    children: [{ path: "/install", element: <Install /> }],
  },
];

export default routes;
