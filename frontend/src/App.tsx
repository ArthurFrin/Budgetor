import { Route, Routes } from "react-router"
import Home from "@/pages/Home"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import { AuthContext, AuthProvider } from "./contexts/AuthContext"

function App() {

  return (
    <>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home/></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
        </Routes>  
      </AuthProvider>
    </>
  )
}

export default App
