import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./AppRoutes.tsx";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;