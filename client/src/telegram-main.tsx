import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TelegramApp from './TelegramApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TelegramApp />
  </StrictMode>
);
