import { createContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { User, LoginData, RegisterData, AuthContextType, LoginResult } from "@/types";

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => false,
  logout: async () => {},
  checkMe: async () => {},
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (data: LoginData): Promise<LoginResult> => {
    try {
      const response = await api.post("login", {
        json: data,
      });
      const userData = await response.json<User>();
      setUser(userData);
      return { success: true }; // Connexion réussie
    } catch (error: unknown) {
      console.error("Erreur lors de la connexion:", error);
      
      // Gestion spécifique de l'erreur 429 (Too Many Requests)
      if (error instanceof Error && 'response' in error) {
        const httpError = error as { response: { status: number; json: () => Promise<{ reset?: number }> } };
        if (httpError.response?.status === 429) {
          try {
            const errorData = await httpError.response.json();
            const retryAfter = errorData.reset ? Math.ceil((errorData.reset - Date.now()) / 1000) : 60;
            return { 
              success: false, 
              error: "rate_limit", 
              retryAfter 
            };
          } catch {
            return { 
              success: false, 
              error: "rate_limit", 
              retryAfter: 60 
            };
          }
        }
        
        // Autres erreurs
        if (httpError.response?.status === 401) {
          return { success: false, error: "invalid_credentials" };
        }
      }
      
      return { success: false, error: "network_error" };
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await api.post("register", {
        json: data,
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
