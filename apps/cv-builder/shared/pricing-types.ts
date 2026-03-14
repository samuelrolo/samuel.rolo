/**
 * Sistema de Planos e Créditos para Exportação de Currículos
 */

export interface PricingPlan {
  id: string;
  name: string;
  credits: number; // Número de exportações sem watermark
  price: number; // Preço em euros
  description: string;
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "plan_1",
    name: "1 Modelo",
    credits: 1,
    price: 2.49,
    description: "Exportação sem watermark de 1 currículo",
  },
  {
    id: "plan_3",
    name: "3 Modelos",
    credits: 3,
    price: 5.0,
    description: "Exportação sem watermark de 3 currículos",
    popular: true, // Plano mais popular
  },
  {
    id: "plan_5",
    name: "5 Modelos",
    credits: 5,
    price: 10.0,
    description: "Exportação sem watermark de 5 currículos",
  },
];

export interface UserCredits {
  userId: number;
  credits: number; // Créditos disponíveis
  totalPurchased: number; // Total de créditos comprados
  totalUsed: number; // Total de créditos usados
}

export interface CreditTransaction {
  id: number;
  userId: number;
  type: "purchase" | "usage" | "refund";
  amount: number; // Positivo para compra/refund, negativo para uso
  balance: number; // Saldo após transação
  paymentId?: number; // Referência ao pagamento (se aplicável)
  resumeId?: number; // Referência ao currículo exportado (se aplicável)
  description: string;
  createdAt: Date;
}
