import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CRMProvider } from './store.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CRMProvider>
      <App />
    </CRMProvider>
  </StrictMode>,
);
