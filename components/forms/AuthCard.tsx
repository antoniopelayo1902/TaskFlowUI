"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { users } from "@/services/mock/users.service";
import type { Role } from "@/lib/roles";
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

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Correo requerido" })
    .email({ message: "Correo inválido" }),
  role: z.enum(["admin", "manager", "developer"]).optional(),
});

type FormValues = z.infer<typeof schema>;

export function AuthCard({
  className,
  mode = "login",
}: {
  className?: string;
  mode?: "login" | "register";
}) {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: users[0]?.email ?? "ana@demo.io",
      role: users[0]?.role ?? "admin",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      // For register we just reuse login behavior (mock)
      await login(values.email, values.role as Role | undefined);
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
          Usa un correo de la lista demo y selecciona un rol.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ana@demo.io"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <div className="mt-1 text-xs text-muted-foreground">
                  Demo: {users.map((u) => u.email).join(" · ")}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <FormControl>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...field}
                  >
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="developer">developer</option>
                  </select>
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

          <div className="text-center text-xs text-muted-foreground">
            No hay backend; esta pantalla solo simula autenticación.
          </div>
        </form>
      </Form>
    </div>
  );
}
