import { describe, expect, it } from "vitest";
import { ApiError, parseApiError } from "@/lib/api/http";

describe("parseApiError", () => {
  it("lee el detail string de FastAPI", () => {
    const error = parseApiError(401, { detail: "Credenciales incorrectas" });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Credenciales incorrectas");
  });

  it("resume la lista de errores de validación 422", () => {
    const error = parseApiError(422, {
      detail: [
        { loc: ["body", "email"], msg: "value is not a valid email" },
        { loc: ["body", "password"], msg: "Field required" },
      ],
    });
    expect(error.message).toContain("email: value is not a valid email");
    expect(error.message).toContain("password: Field required");
  });
});
