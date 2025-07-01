import { createContext, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (data: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: async () => {},
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async ({ email, password }: { email: string; password: string }): Promise<boolean> => {
    try {
      const response = await api.post("login", {
        json: { email, password },
        headers: {
          "Content-Type": "application/json",
        },
      });
      const userData = await response.json<User>();
      setUser(userData);
      return true; // Connexion réussie
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return false; // Connexion échouée
    }
  };

  const logout = async () => {
    try {
      await api.post("logout");
      setUser(null);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };
return (
  <AuthContext.Provider
    value={{ user, login , logout}}
  >
    {children}
  </AuthContext.Provider>
);
}

export { AuthContext, AuthProvider };
