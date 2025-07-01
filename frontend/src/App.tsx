import { Route, Routes } from "react-router";
import Home from "@/pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthContext, AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./components/MainLayout";
import { useContext, useEffect } from "react";


function App() {
  const { checkMe } =  useContext(AuthContext)

  useEffect(() => {
    checkMe().catch((error) => {
      console.error("Erreur lors de la vérification de l'utilisateur :", error);
    });
  }, [checkMe]);
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
        {/* Register sans sidebar */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
