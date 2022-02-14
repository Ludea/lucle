import { Navigate } from 'react-router-dom';
import Dashboard from 'layout/Dashboard';
import Index from 'views/Index';
import OnlineEditor from 'views/Editor';
import Tables from 'views/Tables';
import Login from 'views/Login';

const routes = (isLogged: boolean) => [
  {
    path: '/',
    element: isLogged ? <Dashboard /> : <Navigate to ="/login" />,
    children: [
      { path: '/', element: <Index /> },
      { path: '/editor', element: <OnlineEditor /> },
      { path: '/tables', element: <Tables /> },
    ]
  },
  {
    path: '/login', element: <Login />
  }
 ];

export default routes;
