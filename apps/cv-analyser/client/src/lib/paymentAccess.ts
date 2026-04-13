const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

export type PaymentStatusResponse = {
  success: boolean;
  paid: boolean;
  pending?: boolean;
  status?: string;
  error?: string;
  order_id?: string;
  session_id?: string;
  product_type?: string;
  product_type_mismatch?: boolean;
  email?: string;
  amount?: number;
  currency?: string;
};

type VerifyPaidAccessOptions = {
  orderId?: string | null;
  sessionId?: string | null;
  expectedProductTypes: string[];
};

type PersistVerifiedPaymentOptions = {
  orderIdKeys?: string[];
  sessionIdKeys?: string[];
  legacyPaidKeys?: string[];
};

export function getFirstStoredValue(keys: string[] = []): string | null {
  for (const key of keys) {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

export async function fetchPaymentStatus({
  orderId,
  sessionId,
  expectedProductTypes,
}: VerifyPaidAccessOptions): Promise<PaymentStatusResponse> {
  const trimmedOrderId = orderId?.trim() || '';
  const trimmedSessionId = sessionId?.trim() || '';

  if (!trimmedOrderId && !trimmedSessionId) {
    return {
      success: false,
      paid: false,
      error: 'order_id ou session_id em falta',
    };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: trimmedOrderId || undefined,
        session_id: trimmedSessionId || undefined,
        expected_product_types: expectedProductTypes,
      }),
    });

    const data = await response.json().catch(() => ({}));
    return {
      success: Boolean(data?.success),
      paid: Boolean(data?.paid),
      pending: Boolean(data?.pending),
      status: data?.status,
      error: data?.error,
      order_id: data?.order_id || trimmedOrderId,
      session_id: data?.session_id || trimmedSessionId,
      product_type: data?.product_type,
      product_type_mismatch: Boolean(data?.product_type_mismatch),
      email: data?.email,
      amount: data?.amount,
      currency: data?.currency,
    };
  } catch (error: any) {
    return {
      success: false,
      paid: false,
      error: error?.message || 'Erro ao validar pagamento no servidor',
    };
  }
}

export function persistVerifiedPayment(
  status: PaymentStatusResponse,
  {
    orderIdKeys = [],
    sessionIdKeys = [],
    legacyPaidKeys = [],
  }: PersistVerifiedPaymentOptions = {}
) {
  const orderId = status.order_id || '';
  const sessionId = status.session_id || '';

  for (const key of orderIdKeys) {
    if (orderId) {
      localStorage.setItem(key, orderId);
      sessionStorage.setItem(key, orderId);
    }
  }

  for (const key of sessionIdKeys) {
    if (sessionId) {
      localStorage.setItem(key, sessionId);
      sessionStorage.setItem(key, sessionId);
    }
  }

  for (const key of legacyPaidKeys) {
    if (status.paid) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }
}

export function clearPaymentMarkers(keys: string[] = []) {
  for (const key of keys) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
