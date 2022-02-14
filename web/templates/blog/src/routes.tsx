import Dashboard from 'layout/Dashboard';
import Main from 'layout/Main';
import Index from 'components/admin/Index';
import Login from 'views/Login';
import Register from 'views/Register';

const routes = [
  {
    path: '/admin',
    element: <Dashboard />,
    children: [
      { path: 'index', element: <Index /> }
    ]
  },
  {
    path: '/',
      element: <Main />,
      children: [
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> }
      ]
  }
]

export default routes;
