import { Route, Routes } from "react-router";
import Home from "@/pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgetPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import { AuthContext, AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./components/MainLayout";
import { useContext, useEffect } from "react";
import NewPurchase from "./pages/NewPurchase";
import Categories from "./pages/Categories";
import Profile from "./pages/Profile";
import MyPurchases from "./pages/MyPurchases";


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
          <Route path="/purchase/new" element={<NewPurchase />} />
          <Route path="/purchases" element={<MyPurchases />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/profile" element={<Profile />} />

          {/* autres routes protégées */}
        </Route>

        {/* Routes d'authentification sans sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
