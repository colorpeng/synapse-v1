import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ParentPage } from './pages/ParentPage';
import { StudentPage } from './pages/StudentPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('synapse_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/student"
            element={
              <RequireAuth>
                <StudentPage />
              </RequireAuth>
            }
          />
          <Route
            path="/parent"
            element={
              <RequireAuth>
                <ParentPage />
              </RequireAuth>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);
