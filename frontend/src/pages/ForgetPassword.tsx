import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

// Schéma de validation
const forgetPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

// Types dérivés de Zod
type ForgetPasswordFormData = z.infer<typeof forgetPasswordSchema>;

function ForgetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgetPasswordFormData>({
    resolver: zodResolver(forgetPasswordSchema),
  });

  const onSubmit = async (data: ForgetPasswordFormData) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await api.post("forget-password", { json: data });
      setSuccess(true);
    } catch (error: any) {
      if (error.response?.status === 429) {
        setError("Trop de tentatives. Veuillez réessayer plus tard.");
      } else {
        setError("Une erreur est survenue lors de l'envoi de l'email.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Mot de passe oublié
          </CardTitle>
          <CardDescription className="text-center">
            Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md text-green-800">
                Si un compte existe avec cet email, un lien de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception.
              </div>
              <Button 
                className="w-full" 
                onClick={() => navigate("/login")}
              >
                Retour à la connexion
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
              </Button>
              <div className="text-center">
                <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgetPassword;
