import Icon from "@mui/material/Icon";
import Speedupdate from "views/Speedupdate/Index";
import Launcher from "views/Speedupdate/Launcher";
<<<<<<< HEAD
=======
import Index from "views/AdminIndex";
>>>>>>> 99ebfc6 (wip)

const adminroutes = [
  {
    type: "collapse",
    name: "Home",
    key: "admin",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "admin",
    component: <Index />,
  },
  {
    type: "collapse",
    name: "Speedupdate",
    key: "speedupdate",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "speedupdate",
    component: <Speedupdate />,
  },
  {
    type: "collapse",
    name: "Launcher",
    key: "launcher",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "launcher",
    component: <Launcher />,
  },
];

export default adminroutes;
