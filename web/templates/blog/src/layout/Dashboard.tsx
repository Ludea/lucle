import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { styled } from '@mui/system';
import Sidebar from 'components/admin/Sidebar';
import Navbar from 'components/admin/Navbar';

const DashboardLayoutRoot = styled('div')(
  ({ theme }: any) => ({
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    width: '100%'
  })
);

const DashboardLayoutWrapper = styled('div')(
  ({ theme }) => ({
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden',
    paddingTop: 64,
    [theme.breakpoints.up('lg')]: {
      paddingLeft: 256
    }
  })
);

const DashboardLayoutContainer = styled('div')({
  display: 'flex',
  flex: '1 1 auto',
  overflow: 'hidden'
});

const DashboardLayoutContent = styled('div')({
  flex: '1 1 auto',
  height: '100%',
  overflow: 'auto'
});

const Dashboard = () => {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <DashboardLayoutRoot>
    <Navbar onMobileNavOpen={() => setMobileNavOpen(true)} />
    <Sidebar
	onMobileClose={() => setMobileNavOpen(false)}
        openMobile={isMobileNavOpen} 
    />
    <DashboardLayoutWrapper>
        <DashboardLayoutContainer>
          <DashboardLayoutContent>
    <Outlet />
    </DashboardLayoutContent>
        </DashboardLayoutContainer>
      </DashboardLayoutWrapper>
    </DashboardLayoutRoot>
  );
};

export default Dashboard;
