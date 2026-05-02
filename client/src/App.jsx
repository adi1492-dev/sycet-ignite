import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage      from './pages/LandingPage.jsx';
import LoginPage        from './pages/LoginPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminLoginPage   from './pages/AdminLoginPage.jsx';
import AdminDashboard   from './pages/AdminDashboard.jsx';
import { PrivacyPolicy, TermsOfService } from './pages/LegalPages.jsx';
import { auth } from './api.js';

function StudentRoute({ children }) {
  return auth.isLoggedIn() && auth.getUser()?.role !== 'admin'
    ? children
    : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  return auth.isLoggedIn() && auth.getUser()?.role === 'admin'
    ? children
    : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/admin/login"   element={<AdminLoginPage />} />
        <Route path="/privacy"       element={<PrivacyPolicy />} />
        <Route path="/terms"         element={<TermsOfService />} />

        <Route path="/dashboard" element={
          <StudentRoute><StudentDashboard /></StudentRoute>
        } />
        <Route path="/admin/dashboard" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
