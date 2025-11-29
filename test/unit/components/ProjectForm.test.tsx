import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectForm from "@/components/forms/ProjectForm";
import type { Project } from "@/services/api/projects.service";

const { fetchUsersMock, createProjectMock, updateProjectMock } = vi.hoisted(() => ({
  fetchUsersMock: vi.fn(),
  createProjectMock: vi.fn(),
  updateProjectMock: vi.fn(),
}));

vi.mock("@/services/api/users-public.service", () => {
  return {
    fetchUsers: fetchUsersMock,
  };
});

vi.mock("@/services/api/projects.service", () => {
  return {
    createProject: (...args: any[]) => createProjectMock(...args),
    updateProject: (...args: any[]) => updateProjectMock(...args),
  };
});

describe("ProjectForm", () => {
  beforeEach(() => {
    fetchUsersMock.mockReset();
    createProjectMock.mockReset();
    updateProjectMock.mockReset();
  });

  it("muestra errores de validación cuando faltan datos requeridos", async () => {
    fetchUsersMock.mockResolvedValueOnce([
      { id: "u1", name: "Ana", email: "ana@test.com", role: "developer" },
    ]);

    render(<ProjectForm />);

    // Intenta enviar con valores por default
    const submit = screen.getByRole("button", { name: /crear/i });
    await userEvent.click(submit);

    expect(await screen.findByText(/nombre requerido/i)).toBeInTheDocument();
    // Clave vacía y con longitud mínima 2
    expect(await screen.findByText(/min 2 caracteres/i)).toBeInTheDocument();
    // Owner requerido (aunque el efecto suele poner uno por defecto)
  });

  it("convierte la clave a mayúsculas y crea proyecto con datos válidos", async () => {
    fetchUsersMock.mockResolvedValueOnce([
      { id: "u1", name: "Ana", email: "ana@test.com", role: "developer" },
      { id: "u2", name: "Luis", email: "luis@test.com", role: "manager" },
      { id: "u3", name: "Mia", email: "mia@test.com", role: "developer" },
    ]);

    const saved: Project = {
      id: "p1",
      name: "Proyecto A",
      key: "PA1",
      ownerId: "u1",
      members: ["u1", "u2"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    createProjectMock.mockResolvedValueOnce(saved);

    const onSaved = vi.fn();
    render(<ProjectForm onSaved={onSaved} />);

    // Espera a que se carguen usuarios en el select de Owner (aparecen options)
    const ownerSelect = await screen.findByRole("combobox");

    await userEvent.type(screen.getByPlaceholderText("TaskFlow"), "Proyecto A");

    const keyInput = screen.getByPlaceholderText("TF");
    await userEvent.type(keyInput, "pa1");
    // La UI aplica uppercase onChange, verifica valor transformado
    expect((keyInput as HTMLInputElement).value).toBe("PA1");

    // Verifica que el owner tenga opciones y selecciona explícitamente la primera si se desea
    const ownerOptions = within(ownerSelect).getAllByRole("option");
    expect(ownerOptions.length).toBeGreaterThan(0);
    await userEvent.selectOptions(ownerSelect, "u1");

    const submit = screen.getByRole("button", { name: /^crear$/i });
    await userEvent.click(submit);

    expect(createProjectMock).toHaveBeenCalledWith({
      name: "Proyecto A",
      key: "PA1",
      ownerId: "u1",
      members: expect.any(Array),
    });
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("actualiza proyecto cuando recibe 'initial'", async () => {
    fetchUsersMock.mockResolvedValueOnce([
      { id: "u1", name: "Ana", email: "ana@test.com", role: "developer" },
    ]);

    const initial: Project = {
      id: "pid",
      name: "Init",
      key: "INIT",
      ownerId: "u1",
      members: ["u1"],
      createdAt: "",
      updatedAt: "",
    } as any;

    updateProjectMock.mockResolvedValueOnce({ ...initial, name: "Init-Edit" });

    render(<ProjectForm initial={initial} />);

    // Cambia el nombre
    const nameInput = await screen.findByDisplayValue("Init");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Init-Edit");

    const submit = screen.getByRole("button", { name: /actualizar/i });
    await userEvent.click(submit);

    expect(updateProjectMock).toHaveBeenCalledWith("pid", {
      name: "Init-Edit",
      key: "INIT",
      ownerId: "u1",
      members: ["u1"],
    });
  });
});
