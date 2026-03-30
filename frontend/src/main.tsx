import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ParentPage } from './pages/ParentPage';
import { StudentPage } from './pages/StudentPage';

function ProtectedRoute({ children, role }: { children: JSX.Element; role: 'student' | 'parent' }) {
  const userRaw = localStorage.getItem('synapse_user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (user.role !== role) {
    return <Navigate to={user.role === 'student' ? '/student' : '/parent'} replace />;
  }
  return children;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/student" element={<ProtectedRoute role="student"><StudentPage /></ProtectedRoute>} />
          <Route path="/parent" element={<ProtectedRoute role="parent"><ParentPage /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);
