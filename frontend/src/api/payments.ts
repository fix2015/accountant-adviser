import client from "./client";
import type { PaymentIntent } from "@/types";

export async function createPaymentIntent(type: "consultation" | "extra_questions"): Promise<PaymentIntent> {
  const response = await client.post<PaymentIntent>("/payments/create-intent", { type });
  return response.data;
}

export async function confirmPayment(paymentIntentId: string): Promise<{ success: boolean }> {
  const response = await client.post("/payments/confirm", { payment_intent_id: paymentIntentId });
  return response.data;
}

export async function getPaymentStatus(): Promise<{ has_paid: boolean; questions_remaining: number }> {
  const response = await client.get("/payments/status");
  return response.data;
}
