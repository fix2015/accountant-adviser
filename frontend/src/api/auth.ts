import client from "./client";
import type { AuthTokens, LoginRequest, RegisterRequest, User } from "@/types";

export async function login(data: LoginRequest): Promise<AuthTokens> {
  const response = await client.post<AuthTokens>("/auth/login", data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthTokens> {
  const response = await client.post<AuthTokens>("/auth/register", data);
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await client.get<User>("/users/me");
  return response.data;
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}

export async function refreshToken(refresh_token: string): Promise<AuthTokens> {
  const response = await client.post<AuthTokens>("/auth/refresh", { refresh_token });
  return response.data;
}

export interface BusinessInfoData {
  business_type?: string;
  revenue_range?: string;
  employee_count?: number;
}

export async function updateBusinessInfo(data: BusinessInfoData): Promise<User> {
  const response = await client.patch<User>("/users/me/business", data);
  return response.data;
}
