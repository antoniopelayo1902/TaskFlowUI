"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export const metadata = {
  title: "Perfil | TaskFlow",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [saving, setSaving] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      toast.info("Actualizado", "Preferencias guardadas (mock)");
      setSaving(false);
    }, 350);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>

      <form className="space-y-4 max-w-xl" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Correo</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@demo.io"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Contraseña (no funcional)</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            type="password"
            placeholder="••••••••"
            disabled
            title="Solo mock, no se almacena"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Esta demo no guarda cambios reales ni integra backend.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
