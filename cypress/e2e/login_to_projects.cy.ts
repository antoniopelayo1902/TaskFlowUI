/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

describe("Login y navegación a Proyectos", () => {
  it("inicia sesión y navega a /projects mostrando la página", () => {
    // Intercept del login exitoso
    cy.intercept("POST", "**/api/auth/login", (req) => {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body as string) : (req.body as any);
      expect(body).to.have.property("email");
      expect(body).to.have.property("password");

      req.reply({
        statusCode: 200,
        body: {
          user: {
            id: "u1",
            name: "Alice",
            email: "alice@example.com",
            role: "developer",
          },
          token: "token-xyz",
        },
      });
    }).as("login");

    // Intercepts de la página de proyectos
    cy.intercept("GET", "**/api/users", {
      statusCode: 200,
      body: {
        users: [
          { id: "u1", name: "Alice", email: "alice@example.com", role: "developer" },
          { id: "u2", name: "Bob", email: "bob@example.com", role: "manager" },
        ],
      },
    }).as("users");

    cy.intercept("GET", "**/api/projects", {
      statusCode: 200,
      body: {
        projects: [
          {
            id: "p1",
            name: "Proyecto Demo",
            key: "PD1",
            ownerId: "u2",
            members: ["u1", "u2"],
          },
        ],
      },
    }).as("projects");

    // Flujo de login
    cy.visit("/login");
    cy.findByRole("heading", { name: /bienvenido de vuelta/i }).should("exist");
    cy.findByLabelText(/correo/i).type("alice@example.com");
    cy.findByLabelText(/contraseña/i).type("secret123");
    cy.findByRole("button", { name: /^ingresar$/i }).click();
    cy.wait("@login");

    // Debe redirigir a /dashboard y mostrar toast
    cy.location("pathname").should("eq", "/dashboard");
    cy.assertToast("Sesión iniciada");

    // Navega al apartado de Proyectos desde el sidebar
    cy.findByRole("link", { name: /proyectos/i }).click();

    // Verifica ruta y que la página cargue
    cy.location("pathname").should("eq", "/projects");
    cy.findByRole("heading", { name: /proyectos/i }).should("exist");

    // Espera a que carguen los recursos de la tabla
    cy.wait("@users");
    cy.wait("@projects");

    // Comprueba que se renderiza la fila del proyecto simulado
    cy.findByRole("link", { name: /proyecto demo/i }).should("exist");
  });
});
