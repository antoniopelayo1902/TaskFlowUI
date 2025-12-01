"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useAuth } from "@/components/providers/AuthProvider";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function ProfilePageClient() {
  const { user } = useAuth();

  // Lista de imágenes disponibles en /public/images
  const avatars = [
    "/images/avatar1.png",
    "/images/avatar2.png",
    "/images/avatar3.png",
    "/images/avatar4.png",
    "/images/avatar5.png",
    "/images/avatar6.png",
    "/images/avatar7.png",
    "/images/avatar8.png",
    "/images/avatar9.png",
    "/images/avatar10.png",
  ];

  // Avatar seleccionado temporalmente
  const [selected, setSelected] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>

      <div className="max-w-xl space-y-4 rounded-lg border bg-card p-4">

        {/* Selección de avatar */}
        <div className="space-y-2">
          <label className="mb-1 block text-sm font-medium">
            Seleccionar foto de perfil
          </label>

          <div className="grid grid-cols-5 gap-3">
            {avatars.map((src) => (
              <div
                key={src}
                onClick={() => setSelected(src)}
                className={`cursor-pointer rounded-full border-2 p-1 transition ${
                  selected === src ? "border-blue-500" : "border-transparent"
                }`}
              >
                <Image
                  src={src}
                  width={70}
                  height={70}
                  alt="avatar"
                  className="rounded-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Botón — funcionalidad se agregará en paso 4 */}
          <Button
            disabled={!selected}
            className="mt-2"
            onClick={() => console.log("Avatar seleccionado:", selected)}
          >
            Guardar foto
          </Button>
        </div>

        <hr className="my-4" />

        {/* Nombre */}
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
            {user?.name ?? "-"}
          </div>
        </div>

        {/* Correo */}
        <div>
          <label className="mb-1 block text-sm font-medium">Correo</label>
          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
            {user?.email ?? "-"}
          </div>
        </div>

      </div>
    </div>
  );
}
