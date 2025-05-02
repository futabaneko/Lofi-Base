// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App';
import Footer from './Footer';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1">
        <App />
      </div>
      <Footer />
    </div>
  </React.StrictMode>
);
