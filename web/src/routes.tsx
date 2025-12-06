import { Navigate, Outlet } from "react-router-dom";

import Landing from "views/Landing";
import Install from "layouts/Install";
import ForgotPassword from "views/ForgotPassword";
import Index from "views/AdminIndex";
import Speedupdate from "views/Speedupdate/Index";
import Login from "views/Login";
import Launcher from "views/Speedupdate/Launcher";
import Dashboard from "layouts/Dashboard";
import ListRepo from "views/Speedupdate/Repos";

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

function InstalledSpeedupdate({ isInstalled }: { isInstalled: boolean }) {
  return isInstalled ? <Navigate to="/admin/install" replace /> : <Outlet />;
}

const routes = (isInstalled: boolean) => [
  { path: "/", element: <Landing /> },
  {
    element: <InstalledRoutes isInstalled={isInstalled} />,
    children: [
      { path: "login", element: <Login /> },
      { path: "forgot", element: <ForgotPassword /> },
      {
        element: <PrivateRoutes />,
        children: [
          {
            element: <Dashboard />,
            children: [
              {
                element: <ListRepo />,
                path: "/",
              },
              { path: ":repo", element: <Index /> },
              { path: ":repo/game", element: <Speedupdate /> },
              { path: ":repo/launcher", element: <Launcher /> },
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
