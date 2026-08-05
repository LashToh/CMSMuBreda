import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import SocialFloat from './components/SocialFloat';
import RegisterModal from './components/Register';
import CmsShell from './components/layout/CmsShell';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { RegisterProvider } from './context/RegisterContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import RankingsPage from './pages/RankingsPage';
import ShopPage from './pages/ShopPage';
import NewsPage from './pages/NewsPage';
import DownloadsPage from './pages/DownloadsPage';
import AdminPage from './pages/AdminPage';

function LandingLayout() {
  return (
    <>
      <Navbar />
      <SocialFloat />
      <RegisterModal />
      <LandingPage />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <RegisterProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingLayout />} />
                <Route element={<CmsShell />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/rankings" element={<RankingsPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/downloads" element={<DownloadsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </RegisterProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
