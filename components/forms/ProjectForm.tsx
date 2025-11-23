"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { fetchUsers, type SimpleUser } from "@/services/api/users-public.service";
import type { Project } from "@/services/api/projects.service";
import { createProject, updateProject } from "@/services/api/projects.service";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const schema = z.object({
  name: z.string().trim().min(1, { message: "Nombre requerido" }),
  key: z
    .string()
    .trim()
    .min(2, { message: "Min 2 caracteres" })
    .max(6, { message: "Max 6 caracteres" })
    .regex(/^[A-Z0-9]+$/, { message: "Solo mayúsculas y números" }),
  ownerId: z.string().min(1, { message: "Owner requerido" }),
  members: z.array(z.string()).default([]),
});

type FormInput = z.input<typeof schema>;

export default function ProjectForm({
  onSaved,
  initial,
}: {
  onSaved?: (project: Project) => void;
  initial?: Project | null;
}) {
  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          name: initial.name,
          key: initial.key,
          ownerId: initial.ownerId,
          members: initial.members,
        }
      : {
          name: "",
          key: "",
          ownerId: "",
          members: [],
        },
  });

  const [users, setUsers] = React.useState<SimpleUser[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    fetchUsers()
      .then((us) => {
        if (!mounted) return;
        setUsers(us);
        if (!initial) {
          const ownerId = us[0]?.id ?? "";
          const members = us.slice(0, 2).map((u) => u.id);
          form.setValue("ownerId", ownerId, { shouldDirty: true, shouldValidate: true });
          form.setValue("members", members, { shouldDirty: true, shouldValidate: true });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [initial, form]);

  const onSubmit = async (values: FormInput) => {
    setSaving(true);
    try {
      let saved: Project | undefined;
      if (initial) {
        saved = await updateProject(initial.id, values);
        toast.info("Actualizado", "Proyecto actualizado correctamente");
      } else {
        saved = await createProject(values as Omit<Project, "id">);
        toast.success("Se creó correctamente");
      }
      if (saved) onSaved?.(saved);
    } catch {
      toast.destructive("Error", "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="TaskFlow"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Clave</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
            placeholder="TF"
            {...form.register("key")}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
              form.setValue("key", e.target.value.toUpperCase(), {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
          {form.formState.errors.key && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.key.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Owner</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("ownerId")}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {form.formState.errors.ownerId && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.ownerId.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Miembros</label>
          <div className="grid grid-cols-2 gap-2">
            {users.map((u) => {
              const checked = form.watch("members")?.includes(u.id) ?? false;
              return (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center gap-2 rounded border p-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = new Set(form.getValues("members") ?? []);
                      if (e.target.checked) current.add(u.id);
                      else current.delete(u.id);
                      form.setValue("members", Array.from(current), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                  <span>
                    {u.name} <span className="text-muted-foreground">({u.role})</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : initial ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
