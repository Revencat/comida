// ─── Punto de entrada de FRIDGIE (web · PWA · futuro Tauri) ─────────────────
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store';
import { Layout } from './components/ui';
import HomePage from './pages/HomePage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import PantryPage from './pages/PantryPage';
import ListsPage from './pages/ListsPage';
import DownloadPage from './pages/DownloadPage';
import ScanReceiptPage from './pages/ScanReceiptPage';
import SettingsPage from './pages/SettingsPage';
import { registerServiceWorker } from './platform/pwa';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      {/* HashRouter: compatible con file:// (escritorio empaquetado) y hosting estático */}
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />
            <Route path="pantry" element={<PantryPage />} />
            <Route path="lists" element={<ListsPage />} />
            <Route path="scan" element={<ScanReceiptPage />} />
            <Route path="download" element={<DownloadPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  </React.StrictMode>,
);

// Service worker + avisos de actualización (solo producción/preview)
if (!import.meta.env.DEV || import.meta.env.VITE_SW_IN_DEV === '1') {
  registerServiceWorker(() => {
    window.dispatchEvent(new CustomEvent('fridgie-update-ready'));
  });
}
