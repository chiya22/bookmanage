
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { BookDataProvider } from './contexts/BookDataContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("ルート要素が見つかりませんでした。");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <BookDataProvider>
        <App />
      </BookDataProvider>
    </HashRouter>
  </React.StrictMode>
);
