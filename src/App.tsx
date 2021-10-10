import { useState } from 'react'
import { useRoutes } from 'react-router-dom';
import routes from './routes';

function App() {
 const content = useRoutes(routes);

  return (
	<div>
    {content}
	</div>
  );
}

export default App;
