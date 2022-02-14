import 'react-perfect-scrollbar/dist/css/styles.css';
import { useState } from 'react'
import { useRoutes } from 'react-router-dom';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import GlobalStyles from 'components/GlobalStyles';
import theme from 'theme/Index';
import routes from './routes';

function App() {
 const content = useRoutes(routes);

  return (
  <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
	<GlobalStyles />
	 {content}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
