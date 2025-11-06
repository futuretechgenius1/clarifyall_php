import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { syncService } from './services/syncService';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ToolDetailPage from './components/ToolDetailPage';
import CategoriesPage from './components/CategoriesPage';
import AboutPage from './components/AboutPage';
import SubmitToolPage from './components/SubmitToolPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import VerifyEmailPage from './components/auth/VerifyEmailPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserProfile from './components/UserProfile';
import SavedToolsPage from './components/SavedToolsPage';
import MySubmissionsPage from './components/MySubmissionsPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import CookiePolicy from './components/CookiePolicy';
import Disclaimer from './components/Disclaimer';
import CookieBanner from './components/CookieBanner';
// Prompts Library Components
import PromptsPage from './components/PromptsPage';
import PromptDetailPage from './components/PromptDetailPage';
import PromptForm from './components/PromptForm';
import PromptCollections from './components/PromptCollections';
// Blog Components
import BlogPage from './components/BlogPage';
import BlogDetailPage from './components/BlogDetailPage';
// 404 Page
import NotFoundPage from './components/NotFoundPage';

function App() {
  useEffect(() => {
    // Add global sync functions
    window.exportData = async () => {
      const data = await syncService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clarifyall-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    };

    window.importData = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target.result);
            await syncService.importData(data);
            alert('Data imported successfully! Refreshing page...');
            window.location.reload();
          } catch (error) {
            alert('Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Admin routes without Navbar */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* Public routes with Navbar and Footer */}
            <Route path="/*" element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  {/* Auth routes with Navbar and Footer */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/tool/:id" element={<ToolDetailPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route 
                    path="/submit" 
                    element={
                      <ProtectedRoute requireVerified={true}>
                        <SubmitToolPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile/:userId" 
                    element={<UserProfile />} 
                  />
                  <Route 
                    path="/saved-tools" 
                    element={
                      <ProtectedRoute>
                        <SavedToolsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/my-submissions" 
                    element={
                      <ProtectedRoute>
                        <MySubmissionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/my-profile" 
                    element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    }
                  />
                  {/* Prompts Library Routes */}
                  <Route path="/prompts" element={<PromptsPage />} />
                  <Route path="/prompts/:id" element={<PromptDetailPage />} />
                  <Route 
                    path="/submit-prompt" 
                    element={
                      <ProtectedRoute requireVerified={true}>
                        <PromptForm />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/my-collections" 
                    element={
                      <ProtectedRoute>
                        <PromptCollections />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Blog Routes */}
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogDetailPage />} />
                  
                  {/* Legal Pages */}
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                  
                  {/* 404 Page - Must be last */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <Footer />
                <CookieBanner />
              </>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
