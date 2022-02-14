import { useState } from 'react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { useRoutes } from 'react-router-dom';
import GlobalStyles from 'components/GlobalStyles';
import theme from 'theme/Index';
import routes from './routes';

function App() {
  const [isLogged, setIsLogged] = useState<any>(false);
  const content = useRoutes(routes(isLogged))

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        {content}
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

export default App
