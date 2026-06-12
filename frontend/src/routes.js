import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MainLayout from "./components/MainLayout";
import { PageLoader } from "./components/Loader";

import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Yoga from "./pages/Yoga";
import Recipe from "./pages/Recipe";
import Exercise from "./pages/Exercise";
import Profile from "./pages/Profile";

/** Guard: redirect to /login if not authenticated */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader label="Restoring session..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
}

/** Guard: redirect to /dashboard if already logged in */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader label="Loading..." />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected — wrapped in MainLayout individually */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/yoga" element={<PrivateRoute><Yoga /></PrivateRoute>} />
      <Route path="/recipe" element={<PrivateRoute><Recipe /></PrivateRoute>} />
      <Route path="/exercise" element={<PrivateRoute><Exercise /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
