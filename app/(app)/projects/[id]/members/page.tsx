"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import {
  fetchProject,
  updateProject,
  type Project,
} from "@/services/api/projects.service";
import {
  fetchUsers,
  type SimpleUser,
} from "@/services/api/users-public.service";
import { toast } from "@/lib/toast";

export default function ProjectMembersPage() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "";

  const [project, setProject] = React.useState<Project | null>(null);
  const [users, setUsers] = React.useState<SimpleUser[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [pendingRemoveId, setPendingRemoveId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) return;
    try {
      setInitialLoading(true);
      const [p, us] = await Promise.all([fetchProject(projectId), fetchUsers()]);
      setProject(p);
      setUsers(us);
    } catch {
      setProject(null);
      setUsers([]);
    } finally {
      setInitialLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const members = React.useMemo(() => {
    if (!project) return [] as SimpleUser[];
    return users.filter((u) => project.members.includes(u.id));
  }, [users, project]);

  const nonMembers = React.useMemo(() => {
    if (!project) return users;
    const set = new Set(project.members);
    return users.filter((u) => !set.has(u.id));
  }, [users, project]);

  const addMember = async () => {
    if (!selectedUserId || !project) return;
    if (project.members.includes(selectedUserId)) return;
    setLoading(true);
    try {
      const nextMembers = Array.from(new Set([...project.members, selectedUserId]));
      const updated = await updateProject(project.id, { members: nextMembers });
      setProject(updated);
      setSelectedUserId("");
      toast.success("Se agregó correctamente");
    } catch {
      toast.destructive("No se pudo agregar");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async () => {
    if (!pendingRemoveId || !project) return;
    setLoading(true);
    try {
      const user = users.find((u) => u.id === pendingRemoveId);
      const nextMembers = project.members.filter((m) => m !== pendingRemoveId);
      const patch: Partial<Omit<Project, "id">> = { members: nextMembers };
      // Si se remueve al owner, reasignar ownerId si hay miembros restantes
      if (project.ownerId === pendingRemoveId && nextMembers.length > 0) {
        patch.ownerId = nextMembers[0];
      }
      const updated = await updateProject(project.id, patch);
      setProject(updated);
      toast.destructive("Eliminado", `${user?.name ?? "Miembro"} fue removido`);
    } catch {
      toast.destructive("No se pudo eliminar");
    } finally {
      setLoading(false);
      setPendingRemoveId(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Proyecto no encontrado"
        description="Verifica el identificador en la URL."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Miembros</h1>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Selecciona usuario…</option>
            {nonMembers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          <Button onClick={addMember} disabled={!selectedUserId || loading}>
            Agregar
          </Button>
        </div>
      </div>

      {!members.length ? (
        <EmptyState
          title="Aún no hay miembros"
          description="Agrega miembros para colaborar en este proyecto."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Correo</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Propietario</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2">{m.email}</td>
                  <td className="px-3 py-2">{m.role}</td>
                  <td className="px-3 py-2">
                    {project.ownerId === m.id ? (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">Owner</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingRemoveId(m.id)}
                        disabled={project.ownerId === m.id || loading}
                        title={project.ownerId === m.id ? "No puedes remover al owner" : "Eliminar"}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingRemoveId}
        title="¿Deseas eliminar este registro?"
        description={
          pendingRemoveId
            ? `Eliminar "${users.find((u) => u.id === pendingRemoveId)?.name ?? "miembro"}"`
            : ""
        }
        confirmText="Sí, eliminar"
        cancelText="No"
        onConfirm={removeMember}
        onCancel={() => setPendingRemoveId(null)}
        loading={loading}
      />
    </div>
  );
}
