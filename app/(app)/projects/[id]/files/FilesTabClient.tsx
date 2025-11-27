"use client";

import {
  useEffect,
  useState,
  DragEvent,
  ChangeEvent,
  MouseEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectFile {
  _id: string;
  key: string;
  url: string;
  originalName: string;
  size: number;
  createdAt: string;
}

export default function FilesTabClient({
  projectId,
}: {
  projectId: string;
}) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---------- Cargar lista ----------
  async function loadFiles() {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al cargar archivos");

      const data = await res.json();
      setFiles(data.files ?? []);
    } catch (err) {
      console.error("Error al cargar archivos:", err);
      toast.error("No se pudieron cargar los archivos.");
    }
  }

  useEffect(() => {
    if (!projectId) return;
    loadFiles();
  }, [projectId]);

  // ---------- Drag & Drop ----------
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    setSelectedFile(file ?? null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
  }

  // ---------- Subir ----------
  async function handleUpload(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Selecciona un archivo.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      toast.success("Archivo subido.");
      setSelectedFile(null);
      await loadFiles();
    } catch (err) {
      console.error("Error al subir:", err);
      toast.error("No se pudo subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  }

  // ---------- Eliminar (confirm nativo) ----------
  async function handleDelete(fileId: string) {
    const ok = window.confirm("¿Seguro que deseas eliminar este archivo?");
    if (!ok) return;

    setDeletingId(fileId);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/files/${fileId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Archivo eliminado.");
      await loadFiles();
    } catch (err) {
      console.error("Error al eliminar:", err);
      toast.error("No se pudo eliminar el archivo.");
    } finally {
      setDeletingId(null);
    }
  }

  // ---------- Render ----------
  return (
    <div className="space-y-6">
      {/* ZONA DE SUBIDA */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Archivos del proyecto</h2>

        <div
          className={[
            "flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-10 text-center transition",
            isDragging ? "border-primary bg-muted/50" : "border-muted-foreground/40",
          ].join(" ")}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="text-sm">
            Arrastra un archivo o{" "}
            <label className="text-primary underline cursor-pointer">
              selecciónalo
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </p>

          {selectedFile && (
            <div className="mt-4 text-sm">
              <strong>{selectedFile.name}</strong>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Subiendo..." : "Subir archivo"}
            </Button>
            <Button
              variant="outline"
              disabled={!selectedFile}
              onClick={() => setSelectedFile(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </section>

      {/* LISTA */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold">Lista de archivos</h3>

        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay archivos.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file._id}
                className="flex justify-between items-center border rounded-md px-4 py-2"
              >
                <div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    {file.originalName}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB ·{" "}
                    {new Date(file.createdAt).toLocaleString()}
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(file._id)}
                  disabled={deletingId === file._id}
                >
                  {deletingId === file._id ? "Eliminando..." : "Eliminar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
