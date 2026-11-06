import { apiRequest } from "@/lib/api/http";
import type { TokenResponse, UserResponse } from "@/lib/api/types";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export async function loginApi(email: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function meApi(): Promise<UserResponse> {
  return apiRequest<UserResponse>("/auth/me", { authenticated: true });
}

export async function registerApi(data: RegisterRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
