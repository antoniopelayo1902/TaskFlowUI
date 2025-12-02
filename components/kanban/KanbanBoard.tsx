"use client";

import * as React from "react";
import Column from "@/components/kanban/Column";
import { fetchTasks, type Task } from "@/services/api/tasks.service";

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasks({ projectId });
      setTasks(data);
    } catch {
      // noop; UI de kanban es best-effort
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const todo = React.useMemo(() => tasks.filter((t) => t.status === "Todo"), [tasks]);
  const doing = React.useMemo(() => tasks.filter((t) => t.status === "Doing"), [tasks]);
  const done = React.useMemo(() => tasks.filter((t) => t.status === "Done"), [tasks]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Column title="Todo" tasks={todo} />
      <Column title="Doing" tasks={doing} />
      <Column title="Done" tasks={done} />
    </div>
  );
}
