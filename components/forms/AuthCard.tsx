"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { registerAccount } from "@/services/api/auth.service";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Esquema para LOGIN
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Correo requerido" })
    .email({ message: "Correo inválido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

// Esquema para REGISTRO
const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nombre requerido" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Correo requerido" })
    .email({ message: "Correo inválido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function AuthCard({
  className,
  mode = "login",
  returnTo,
}: {
  className?: string;
  mode?: "login" | "register";
  returnTo?: string;
}) {
  const { login } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Elegimos el esquema según el modo
  const schema = mode === "login" ? loginSchema : registerSchema;

  // Tipo combinado para que React Hook Form no se queje
  type FormValues = LoginValues & Partial<RegisterValues>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues:
      mode === "login"
        ? {
            email: "",
            password: "",
          }
        : {
            name: "",
            email: "",
            password: "",
          },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      if (mode === "login") {
        // LOGIN: correo + contraseña
        await login(values.email, values.password, returnTo);
        // El AuthProvider ya hace toast y redirige a /dashboard
      } else {
        // REGISTRO: nombre + correo + contraseña
        await registerAccount(
          values.name ?? "",
          values.email,
          values.password
        );
        toast.success("Cuenta creada correctamente, ahora puedes iniciar sesión");
        router.push("/login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-lg border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-2xl font-semibold">
          {mode === "login" ? "Ingresar" : "Crear cuenta"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Inicia sesión con tu correo y contraseña."
            : "Completa el formulario para registrarte en TaskFlow."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {mode === "register" && (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tu nombre"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? mode === "login"
                ? "Ingresando..."
                : "Registrando..."
              : mode === "login"
              ? "Ingresar"
              : "Crear cuenta"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
