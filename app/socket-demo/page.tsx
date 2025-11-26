"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import RealtimeActivityFeed from "@/components/realtime/RealtimeActivityFeed";
import ProjectPresence from "@/components/realtime/ProjectPresence";
import TaskEventsDemo from "@/components/realtime/TaskEventsDemo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";

export default function SocketDemoPage() {
  const search = useSearchParams();
  const initialProjectId = useMemo(() => search?.get("projectId") || "demo", [search]);
  const [projectId, setProjectId] = useState<string>(initialProjectId);
  const { connected, error, socket } = useSocket();

  type LogEntry = {
    ts: number;
    kind: "info" | "error" | "event";
    event?: string;
    payload?: any;
    message?: string;
  };

  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Log de conexión/desconexión
  useEffect(() => {
    setLogs((prev) => [
      {
        ts: Date.now(),
        kind: "info" as const,
        message: connected ? "socket connected" : "socket disconnected",
      },
      ...prev,
    ].slice(0, 200));
  }, [connected]);

  // Log de errores de conexión
  useEffect(() => {
    if (error) {
      setLogs((prev) => [
        { ts: Date.now(), kind: "error" as const, message: error },
        ...prev,
      ].slice(0, 200));
    }
  }, [error]);

  // Log de cualquier evento entrante del servidor
  useEffect(() => {
    if (!socket) return;
    const handler = (event: string, ...args: any[]) => {
      setLogs((prev) => [
        { ts: Date.now(), kind: "event" as const, event, payload: args?.[0] },
        ...prev,
      ].slice(0, 200));
    };
    socket.onAny(handler);
    return () => {
      socket.offAny(handler);
    };
  }, [socket]);

  type ProjectListItem = {
    id: string;
    name: string;
    key: string;
    ownerId: string;
  };

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        setLoadingProjects(true);
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancel && data?.projects) {
          setProjects(data.projects as ProjectListItem[]);
        }
      } finally {
        if (!cancel) setLoadingProjects(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Socket Demo</h1>
        <div
          className={`flex items-center gap-2 text-sm ${
            connected ? "text-green-600" : "text-muted-foreground"
          }`}
          title={connected ? "Conectado" : "Desconectado"}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {connected ? "Conectado" : "Sin conexión"}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="projectId">Project ID (room: project:{projectId})</Label>
          <Input
            id="projectId"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Ingresa el Project ID para entrar al room"
          />
          <p className="text-xs text-muted-foreground">
            También puedes pasar ?projectId=XYZ en la URL para inicializar este valor.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">Proyectos disponibles</h2>
          <p className="text-xs text-muted-foreground">
            Copia el ID del proyecto y úsalo para entrar al room project:{projectId}.
          </p>
          {loadingProjects ? (
            <div className="text-sm text-muted-foreground">Cargando proyectos…</div>
          ) : projects.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay proyectos.</div>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate">
                      <span className="font-medium">{p.name}</span>{" "}
                      <span className="text-muted-foreground">[{p.key}]</span>
                    </div>
                    <div className="text-xs text-muted-foreground break-all">
                      ID: <code>{p.id}</code>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(p.id)}
                      title="Copiar ID"
                    >
                      Copiar ID
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ProjectPresence projectId={projectId} />
          <TaskEventsDemo projectId={projectId} />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-semibold">Socket logs</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setLogs([])}>
                  Limpiar
                </Button>
              </div>
            </div>
            <div className="p-3">
              {logs.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sin logs</div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                  {logs.map((l, i) => (
                    <li key={i} className="rounded-md border p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {l.kind}
                          {l.event ? ` • ${l.event}` : ""}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(l.ts).toLocaleTimeString()}
                        </span>
                      </div>
                      {l.message && (
                        <div className={l.kind === "error" ? "text-red-600" : "text-muted-foreground"}>
                          {l.message}
                        </div>
                      )}
                      {l.payload !== undefined && (
                        <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
                          {JSON.stringify(l.payload, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <RealtimeActivityFeed />
        </div>
      </div>
    </div>
  );
}
