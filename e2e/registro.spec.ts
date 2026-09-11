import { test, expect } from "@playwright/test";

/**
 * Cubre el criterio de aceptación de Fase 1: un visitante debe poder
 * entrar a EDDOE, entender qué es, e iniciar su inscripción con un correo.
 * Requiere DATABASE_URL apuntando a una base de datos de pruebas.
 */
test("un visitante puede iniciar su inscripción con un correo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Evaluación del Desempeño Docente/i })).toBeVisible();

  await page.getByRole("link", { name: "Inscribirme" }).first().click();
  await expect(page).toHaveURL(/\/registro$/);

  const email = `docente.${Date.now()}@example.com`;
  await page.getByLabel(/correo electrónico institucional/i).fill(email);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByText(/Enviamos un correo de verificación/i)).toBeVisible();
});
