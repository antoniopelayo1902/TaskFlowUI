"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export default function GoogleButton() {
  const { loginWithGoogle } = useAuth();

  const login = useGoogleLogin({
    flow: "auth-code",
    redirect_uri: "http://localhost:3000",
    scope: "openid profile email",
    onSuccess: async (codeResponse) => {
      try {
        await loginWithGoogle(codeResponse.code);
      } catch (error) {
        console.error(error);
        toast.destructive("Ocurrió un error al iniciar sesión con Google");
      }
    },
    onError: () => {
      toast.destructive("No se pudo iniciar sesión con Google");
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => login()}
    >
      Continuar con Google
    </Button>
  );
}

