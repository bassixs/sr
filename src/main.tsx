import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter'; // локальный вариативный Inter (кириллица + латиница, без внешних запросов)
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
