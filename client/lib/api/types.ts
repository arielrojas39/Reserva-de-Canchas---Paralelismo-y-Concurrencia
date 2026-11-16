/**
 * Tipos del contrato FastAPI generados desde `openapi.json`.
 *
 * No editar `schema.d.ts` a mano. Para regenerarlo con el backend levantado:
 *
 *   pnpm generate:api
 *
 * La UI mantiene sus propios tipos de dominio en `@/types`; los mappers de
 * `lib/api/mappers.ts` son el único punto donde se traduce el contrato.
 */
import type { components } from "@/lib/api/schema";

type Schemas = components["schemas"];

export type AvailabilityResponse = Schemas["AvailabilityResponse"];
export type CourtResponse = Schemas["CourtResponse"];
export type ReservationResponse = Schemas["ReservationResponse"];
export type TokenResponse = Schemas["TokenResponse"];
export type UserResponse = Schemas["UserResponse"];
export type PreferenceResponse = Schemas["PreferenceResponse"];
export type PaymentStatusResponse = Schemas["PaymentStatusResponse"];

export type RegisterRequest = Schemas["UserRegister"];
export type CreateReservationRequest = Schemas["ReservationCreate"];
