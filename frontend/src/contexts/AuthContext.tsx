import { createContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { User, LoginData, RegisterData, AuthContextType } from "@/types";

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  checkMe: async () => {},
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<boolean> => {
    try {
      const response = await api.post("login", {
        json: { email, password },
      });
      const userData = await response.json<User>();
      setUser(userData);
      return true; // Connexion réussie
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return false; // Connexion échouée
    }
  };

  const register = async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name?: string;
  }): Promise<boolean> => {
    try {
      const response = await api.post("register", {
        json: { email, password, name },
      });
      const userData = await response.json<User>();
      setUser(userData);
      return true; // Inscription réussie
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      return false; // Inscription échouée
    }
  };

  const logout = async () => {
    try {
      await api.post("logout", {
        json: {},
      });

      setUser(null);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const checkMe = async () => {
    console.log("Vérification de l'utilisateur connecté...");
    try {
      const response = await api.get("me");
      if (response.ok) {
        const userData = await response.json<User>();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'utilisateur:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkMe().catch((error) => {
      console.error("Erreur lors de la vérification de l'utilisateur :", error);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, checkMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
