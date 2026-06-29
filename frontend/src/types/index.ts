export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  created_at: string;
  questions_remaining: number;
  has_paid: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  session_id: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  messages: ChatMessage[];
}

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  status: "processing" | "processed" | "error";
  summary?: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  category: "income" | "expense" | "tax" | "asset" | "liability" | "strategy" | "regulation";
  value: string;
  details?: string;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  label?: string;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
}

export interface Strategy {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  created_at: string;
  download_url: string;
}

export interface AdminStats {
  total_users: number;
  total_payments: number;
  total_revenue: number;
  active_sessions: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  has_paid: boolean;
  questions_remaining: number;
  total_documents: number;
}

export interface AdminPayment {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  status: string;
  created_at: string;
  type: "consultation" | "extra_questions";
}
