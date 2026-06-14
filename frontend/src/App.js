import { AuthProvider } from "./context/AuthContext";
import { StatsProvider } from "./context/StatsContext";
import AppRoutes from "./routes";

function App() {
  return (
    <AuthProvider>
      <StatsProvider>
        <AppRoutes />
      </StatsProvider>
    </AuthProvider>
  );
}

export default App;
