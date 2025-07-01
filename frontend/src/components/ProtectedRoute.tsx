import { useContext } from "react";
import { Navigate } from "react-router";

import type { ReactNode } from "react";
import { AuthContext } from "@/contexts/AuthContext";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;