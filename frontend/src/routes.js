import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Yoga from "./pages/Yoga";
import Recipe from "./pages/Recipe";
import Exercise from "./pages/Exercise";

function AppRoutes({ searchQuery }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard searchQuery={searchQuery} />} />
      <Route path="/yoga" element={<Yoga />} />
      <Route path="/recipe" element={<Recipe />} />
      <Route path="/exercise" element={<Exercise />} />
    </Routes>
  );
}

export default AppRoutes;
