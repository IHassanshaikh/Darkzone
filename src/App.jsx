import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import CommandDashboard from './pages/CommandDashboard';
import AreaDetail from './pages/AreaDetail';
import Resources from './pages/Resources';
import AllocationDelivery from './pages/AllocationDelivery';
import VolunteerDashboard from './pages/VolunteerDashboard';
import VolunteersDirectory from './pages/VolunteersDirectory';
import MeshSimulator from './pages/MeshSimulator';
import AdminPanel from './pages/AdminPanel';
import ReportTriage from './pages/ReportTriage';
import LimitsTradeoffs from './pages/LimitsTradeoffs';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-row">
        <Sidebar />
        <main className="flex-1 overflow-y-auto max-h-[calc(100vh-61px)]">
          <Routes>
            <Route path="/" element={<CommandDashboard />} />
            <Route path="/areas/:id" element={<AreaDetail />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/allocation" element={<AllocationDelivery />} />
            <Route path="/volunteer" element={<VolunteerDashboard />} />
            <Route path="/volunteers" element={<VolunteersDirectory />} />
            <Route path="/mesh" element={<MeshSimulator />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/reports/triage" element={<ReportTriage />} />
            <Route path="/limits" element={<LimitsTradeoffs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
