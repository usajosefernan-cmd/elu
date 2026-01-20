import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/Login';
import ModeSelection from './pages/ModeSelection';
import Gallery from './pages/Gallery';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/modes" element={<ModeSelection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster position="bottom-right" theme="dark" />
    </AuthProvider>
  );
}

export default App;
