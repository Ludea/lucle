import Dashboard from 'layout/Dashboard';
import Index from 'components/admin/Index';
const routes = [
  {
    path: '/',
    element: <Dashboard />,
    children: [
      { path: 'index', element: <Index /> },
    ]
  },
]

export default routes;
