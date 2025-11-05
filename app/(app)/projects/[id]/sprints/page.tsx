"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import SprintForm from "@/components/forms/SprintForm";
import EmptyState from "@/components/common/EmptyState";
import {
  listSprints,
  type Sprint,
  deleteSprint,
} from "@/services/mock/sprints.service";
import { toast } from "@/lib/toast";

export default function ProjectSprintsPage() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "p1";

  const [sprints, setSprints] = React.useState<Sprint[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Sprint | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Sprint | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setSprints(listSprints(projectId));
  }, [projectId]);

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (s: Sprint) => {
    setEditing(s);
    setOpen(true);
  };

  const onSaved = () => {
    toast.success(editing ? "Actualizado" : "Se creó correctamente");
    setOpen(false);
    setEditing(null);
    setSprints(listSprints(projectId));
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const ok = deleteSprint(pendingDelete.id);
      if (ok) {
        toast.destructive("Eliminado", `${pendingDelete.name} se eliminó correctamente`);
        setSprints(listSprints(projectId));
      } else {
        toast.destructive("No se pudo eliminar");
      }
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Sprints</h1>
        <Button onClick={onCreate}>Crear sprint</Button>
      </div>

      {!sprints.length ? (
        <EmptyState
          title="Aún no hay sprints"
          description="Crea tu primer sprint para planificar el trabajo."
          actionLabel="Crear sprint"
          onAction={onCreate}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Inicio</th>
                <th className="px-3 py-2 font-medium">Fin</th>
                <th className="px-3 py-2 font-medium">Objetivo</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sprints.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2">{new Date(s.startDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{new Date(s.endDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{s.goal ?? "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(s)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPendingDelete(s)}>
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

      <Dialog open={open} onOpenChange={(o) => (!o ? setOpen(false) : setOpen(true))}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar sprint" : "Crear sprint"}</DialogTitle>
          </DialogHeader>
          <SprintForm projectId={projectId} initial={editing ?? undefined} onSaved={onSaved} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        title="¿Deseas eliminar este registro?"
        description={pendingDelete ? `Eliminar "${pendingDelete.name}"` : ""}
        confirmText="Sí, eliminar"
        cancelText="No"
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
