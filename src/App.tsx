import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import { AudioCoordinationProvider } from './contexts/AudioCoordinationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { PublicRoute } from './components/routing/PublicRoute';
import { FocusMusicPlayer } from './components/music/FocusMusicPlayer';
import { queryClient } from './config/queryClient';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Protected pages
import { PortalSelectionPage } from './pages/PortalSelectionPage';
import { PBLDashboardPage } from './pages/pbl/PBLDashboardPage';
import { PBLDocumentPage } from './pages/pbl/PBLDocumentPage';
import { ConceptValidationPage } from './pages/pbl/ConceptValidationPage';
import { SensaDashboardPage, SensaCourseDetailPage, SensaDocumentPage } from './pages/sensa';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ProfileSetupPage } from './pages/profile/ProfileSetupPage';
import { CoursesListPage, CourseDetailPage } from './pages/courses';
import { ProcessingStatusPage } from './pages/processing';
import { ConceptMapPage } from './pages/conceptMap';
import { UIShowcasePage } from './pages/UIShowcasePage';
import ProgressDashboardPage from './pages/progress/ProgressDashboardPage';

function AnimatedRoutes() {
  const location = useLocation();
  
  // Show music player only in Sensa Learn portal
  const showMusicPlayer = location.pathname.startsWith('/sensa');

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {/* Public routes - redirect to dashboard if authenticated */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PortalSelectionPage />
            </ProtectedRoute>
          }
        />
        
        {/* PBL Portal Routes */}
        <Route
          path="/pbl"
          element={
            <ProtectedRoute>
              <PBLDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pbl/courses"
          element={
            <ProtectedRoute>
              <CoursesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pbl/courses/:courseId"
          element={
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pbl/document/:documentId"
          element={
            <ProtectedRoute>
              <PBLDocumentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pbl/document/:documentId/validate"
          element={
            <ProtectedRoute>
              <ConceptValidationPage />
            </ProtectedRoute>
          }
        />
        
        {/* Sensa Learn Portal Routes */}
        <Route
          path="/sensa"
          element={
            <ProtectedRoute>
              <SensaDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sensa/course/:courseId"
          element={
            <ProtectedRoute>
              <SensaCourseDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sensa/document/:documentId"
          element={
            <ProtectedRoute>
              <SensaDocumentPage />
            </ProtectedRoute>
          }
        />
        
        {/* Progress Dashboard Route */}
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressDashboardPage />
            </ProtectedRoute>
          }
        />
        
        {/* Profile Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/setup"
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />
        
        {/* Legacy course routes (redirect to PBL) */}
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CoursesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/processing/:taskId"
          element={
            <ProtectedRoute>
              <ProcessingStatusPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/concept-map"
          element={
            <ProtectedRoute>
              <ConceptMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/documents/:documentId/concept-map"
          element={
            <ProtectedRoute>
              <ConceptMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/concept-map/:documentId"
          element={
            <ProtectedRoute>
              <ConceptMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ui-showcase"
          element={
            <ProtectedRoute>
              <UIShowcasePage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect - Portal Selection */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
    
    {/* Focus Music Player - Only in Sensa Learn portal */}
    {showMusicPlayer && <FocusMusicPlayer />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <MusicPlayerProvider>
              <AudioCoordinationProvider>
                <div className="min-h-screen bg-gradient-to-br from-purple-50 via-orange-50 to-pink-50
                                dark:from-dark-bg-primary dark:via-dark-bg-secondary dark:to-[#241539]">
                  
                  {/* Theme Toggle */}
                  <div className="fixed top-4 right-4 z-50">
                    <ThemeToggle />
                  </div>
                  
                  <BrowserRouter>
                    <AnimatedRoutes />
                  </BrowserRouter>
                </div>
              </AudioCoordinationProvider>
            </MusicPlayerProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
