import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Deals from './deals.jsx';
import App from './App.jsx';



ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* 1. La racine "/" ouvre deals.jsx par défaut */}
      <Route path="/" element={<Deals />} />
      
      {/* 2. Le lien "/App.jsx" ouvre votre page de Chat (App) */}
      <Route path="/App.jsx" element={<App />} />
    </Routes>
  </BrowserRouter>
);
