import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormFiller from './pages/FormFiller';
import AdminFormView from './pages/AdminFormView';
import Navbar from './components/Navbar';
import api from './api/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return setIsAuthenticated(false);
      try {
        await api.get('/auth/me');
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Navbar onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/form/new" element={<FormBuilder />} />
        <Route path="/form/:id" element={<FormFiller />} />
        <Route path="/admin/forms/:id/live" element={<AdminFormView />} />
      </Routes>
    </Router>
  );
}

export default App;
