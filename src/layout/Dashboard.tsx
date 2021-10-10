import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from 'components/admin/Sidebar';

const Dashboard = () => {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <Outlet />
  );
};

export default Dashboard;
