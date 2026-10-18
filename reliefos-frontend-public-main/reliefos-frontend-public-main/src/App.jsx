import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/index.jsx';
import Layout from './components/Layout.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import AreaDetailPage from './pages/AreaDetailPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import AllocationPage from './pages/AllocationPage.jsx';
import VolunteersPage from './pages/VolunteersPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';
import TriagePage from './pages/TriagePage.jsx';
import MeshSimulatorPage from './pages/MeshSimulatorPage.jsx';
import LimitsPage from './pages/LimitsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="areas/:id" element={<AreaDetailPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="allocation" element={<AllocationPage />} />
            <Route path="volunteers" element={<VolunteersPage />} />
            <Route path="verification" element={<VerificationPage />} />
            <Route path="triage" element={<TriagePage />} />
            <Route path="mesh" element={<MeshSimulatorPage />} />
            <Route path="limits" element={<LimitsPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
