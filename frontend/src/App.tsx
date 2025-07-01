import { Route, Routes } from "react-router";
import Home from "@/pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./components/MainLayout";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Groupe de routes protégées */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          {/* autres routes protégées */}
        </Route>

        {/* Login sans sidebar */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
