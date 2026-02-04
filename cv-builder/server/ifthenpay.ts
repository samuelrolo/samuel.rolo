/**
 * IFTHENPay Integration via Share2Inspire Backend
 * Usa a API centralizada do backend Share2Inspire
 */

import axios from "axios";

const BACKEND_API_URL = "https://share2inspire-beckend.lm.r.appspot.com/api/payment";

export interface MBWayPaymentRequest {
  phone: string; // Número de telemóvel (9 dígitos)
  amount: number; // Valor em euros
  orderId: string; // ID único da encomenda
  name?: string;
  email?: string;
  description?: string;
}

export interface MultibancoPaymentRequest {
  amount: number; // Valor em euros
  orderId: string; // ID único da encomenda
  name?: string;
  email?: string;
  description?: string;
}

export interface MBWayPaymentResponse {
  success: boolean;
  requestId?: string;
  status?: "pending" | "paid" | "error";
  message?: string;
}

export interface MultibancoPaymentResponse {
  success: boolean;
  entity?: string; // Entidade Multibanco
  reference?: string; // Referência Multibanco
  amount?: number;
  expiryDate?: string;
  message?: string;
}

/**
 * Criar pagamento MB Way através do backend Share2Inspire
 */
export async function createMBWayPayment(
  request: MBWayPaymentRequest
): Promise<MBWayPaymentResponse> {
  try {
    // Validar número de telemóvel (9 dígitos)
    const phoneRegex = /^9[1236]\d{7}$/;
    if (!phoneRegex.test(request.phone)) {
      return {
        success: false,
        message: "Número de telemóvel inválido. Deve ter 9 dígitos e começar por 9.",
      };
    }

    // Validar valor (mínimo 1€)
    if (request.amount < 1) {
      return {
        success: false,
        message: "O valor mínimo é 1€.",
      };
    }

    // Chamada à API do backend Share2Inspire
    const response = await axios.post(
      `${BACKEND_API_URL}/mbway`,
      {
        orderId: request.orderId,
        amount: request.amount.toFixed(2),
        mobileNumber: request.phone,
        customerName: request.name || "",
        customerEmail: request.email || "",
        description: request.description || `CV Builder - ${request.orderId}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (response.data.success) {
      return {
        success: true,
        requestId: response.data.requestId || response.data.data?.requestId,
        status: "pending",
        message: response.data.message || "Pedido MB Way enviado. Confirme no seu telemóvel.",
      };
    } else {
      return {
        success: false,
        message: response.data.message || response.data.error || "Erro ao criar pagamento MB Way.",
      };
    }
  } catch (error: any) {
    console.error("Erro ao criar pagamento MB Way:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao comunicar com o serviço de pagamentos.",
    };
  }
}

/**
 * Criar referência Multibanco através do backend Share2Inspire
 */
export async function createMultibancoReference(
  request: MultibancoPaymentRequest
): Promise<MultibancoPaymentResponse> {
  try {
    // Validar valor (mínimo 1€, máximo 999999.99€)
    if (request.amount < 1 || request.amount > 999999.99) {
      return {
        success: false,
        message: "Valor inválido. Deve estar entre 1€ e 999999.99€.",
      };
    }

    // Chamada à API do backend Share2Inspire
    const response = await axios.post(
      `${BACKEND_API_URL}/multibanco`,
      {
        orderId: request.orderId,
        amount: request.amount.toFixed(2),
        name: request.name || "",
        email: request.email || "",
        description: request.description || `CV Builder - ${request.orderId}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (response.data.success) {
      // Calcular data de expiração (3 dias conforme backend)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);

      return {
        success: true,
        entity: response.data.entity || response.data.data?.entity,
        reference: response.data.reference || response.data.data?.reference,
        amount: request.amount,
        expiryDate: expiryDate.toISOString().split("T")[0],
        message: response.data.message || "Referência Multibanco gerada com sucesso.",
      };
    } else {
      return {
        success: false,
        message: response.data.message || response.data.error || "Erro ao gerar referência Multibanco.",
      };
    }
  } catch (error: any) {
    console.error("Erro ao criar referência Multibanco:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao comunicar com o serviço de pagamentos.",
    };
  }
}

/**
 * Verificar estado de pagamento MB Way
 * Nota: O backend Share2Inspire não expõe endpoint de verificação,
 * então usamos callbacks/webhooks para confirmação automática
 */
export async function checkMBWayPaymentStatus(
  requestId: string
): Promise<MBWayPaymentResponse> {
  // Por enquanto, retornar pending
  // A confirmação será feita via webhook do IFTHENPay
  return {
    success: true,
    requestId: requestId,
    status: "pending",
    message: "Aguardando confirmação de pagamento.",
  };
}
