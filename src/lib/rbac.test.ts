import { describe, it, expect } from "vitest";
import { hasPermission, roleHasPermission } from "./rbac";

describe("rbac", () => {
  it("SUPER_ADMIN puede aprobar registros", () => {
    expect(roleHasPermission("SUPER_ADMIN", "registration.approve")).toBe(true);
  });

  it("EVALUATOR no puede aprobar registros", () => {
    expect(roleHasPermission("EVALUATOR", "registration.approve")).toBe(false);
  });

  it("STATION_EDITOR puede editar borradores pero no publicar", () => {
    expect(roleHasPermission("STATION_EDITOR", "station.editDraft")).toBe(true);
    expect(roleHasPermission("STATION_EDITOR", "station.publish")).toBe(false);
  });

  it("hasPermission es verdadero si CUALQUIER rol del usuario lo tiene", () => {
    expect(hasPermission(["PARTICIPANT", "EVALUATOR"], "evidence.view.assigned")).toBe(true);
    expect(hasPermission(["PARTICIPANT"], "user.manage")).toBe(false);
  });

  it("solo SUPER_ADMIN puede editar una rúbrica ya publicada", () => {
    expect(roleHasPermission("SUPER_ADMIN", "rubric.editPublished")).toBe(true);
    expect(roleHasPermission("ACADEMIC_ADMIN", "rubric.editPublished")).toBe(false);
  });
});
