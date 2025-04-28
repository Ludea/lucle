import Icon from "@mui/material/Icon";
import Speedupdate from "views/Speedupdate/Index";
import Launcher from "views/Speedupdate/Launcher";
import Index from "views/AdminIndex";

const adminroutes = [
  {
    type: "collapse",
    name: "Home",
    key: "admin",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: ":repo",
    component: <Index />,
  },
  {
    type: "collapse",
    name: "Speedupdate",
    key: "game",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: ":repo/game",
    component: <Speedupdate />,
  },
  {
    type: "collapse",
    name: "Launcher",
    key: "launcher",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: ":repo/launcher",
    component: <Launcher />,
  },
];

export default adminroutes;
