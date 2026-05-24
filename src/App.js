import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SessionSync from './components/SessionSync';
import ToastStack from './components/ToastStack';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import CompendiumPage from './CompendiumPage';
import ProfilePage from './pages/ProfilePage';
import CharacterSheetPage from './pages/CharacterSheetPage';
import { CharacterGeneratorProvider } from './context/CharacterGeneratorContext';
import GeneratorMechanicsPage from './pages/GeneratorMechanicsPage';
import GeneratorStoryPage from './pages/GeneratorStoryPage';
import GeneratorPortraitPage from './pages/GeneratorPortraitPage';

function GeneratorLayout() {
  const location = useLocation();
  return (
    <CharacterGeneratorProvider>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </CharacterGeneratorProvider>
  );
}

function LegacyProfileCharacterRedirect() {
  const { id } = useParams();
  return <Navigate to={`/characters/${id}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SessionSync />
          <ToastStack />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compendium"
              element={
                <ProtectedRoute>
                  <CompendiumPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/characters/:id"
              element={
                <ProtectedRoute>
                  <CharacterSheetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/characters/:id"
              element={
                <ProtectedRoute>
                  <LegacyProfileCharacterRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/generator"
              element={
                <ProtectedRoute>
                  <GeneratorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="mechanics" replace />} />
              <Route path="mechanics" element={<GeneratorMechanicsPage />} />
              <Route path="story" element={<GeneratorStoryPage />} />
              <Route path="portrait" element={<GeneratorPortraitPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
