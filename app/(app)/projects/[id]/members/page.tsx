"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import {
  getProjectById,
  getMembers,
  addMemberToProject,
  removeMemberFromProject,
} from "@/services/mock/projects.service";
import { listUsers, getUserById } from "@/services/mock/users.service";
import { toast } from "@/lib/toast";

export default function ProjectMembersPage() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "p1";

  const [refresh, setRefresh] = React.useState(0);
  const project = getProjectById(projectId);
  const members = project ? getMembers(project) : [];
  const allUsers = listUsers();
  const nonMembers = allUsers.filter((u) => !project?.members.includes(u.id));

  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [pendingRemoveId, setPendingRemoveId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const addMember = async () => {
    if (!selectedUserId || !project) return;
    setLoading(true);
    setTimeout(() => {
      const res = addMemberToProject(project.id, selectedUserId);
      if (res) {
        toast.success("Se agregó correctamente");
        setSelectedUserId("");
        setRefresh((x) => x + 1);
      } else {
        toast.destructive("No se pudo agregar");
      }
      setLoading(false);
    }, 250);
  };

  const removeMember = async () => {
    if (!pendingRemoveId || !project) return;
    setLoading(true);
    setTimeout(() => {
      const user = getUserById(pendingRemoveId);
      const res = removeMemberFromProject(project.id, pendingRemoveId);
      if (res) {
        toast.destructive("Eliminado", `${user?.name ?? "Miembro"} fue removido`);
        setRefresh((x) => x + 1);
      } else {
        toast.destructive("No se pudo eliminar");
      }
      setLoading(false);
      setPendingRemoveId(null);
    }, 250);
  };

  if (!project) {
    return (
      <EmptyState
        title="Proyecto no encontrado"
        description="Verifica el identificador en la URL."
      />
    );
  }

  return (
    <div key={refresh} className="space-y-6">
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
                        disabled={project.ownerId === m.id}
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
          pendingRemoveId ? `Eliminar "${getUserById(pendingRemoveId)?.name ?? "miembro"}"` : ""
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
