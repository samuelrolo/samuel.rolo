export interface EmailGateState {
  unlocked: boolean;
  email: string;
}

function getStorageKeys(scope: string) {
  return {
    unlocked: `email_gate:${scope}:unlocked`,
    email: `email_gate:${scope}:email`,
  };
}

export function readEmailGateState(scope: string): EmailGateState {
  if (typeof window === 'undefined') {
    return { unlocked: false, email: '' };
  }

  const keys = getStorageKeys(scope);
  const unlocked = localStorage.getItem(keys.unlocked) === '1' || sessionStorage.getItem(keys.unlocked) === '1';
  const email = localStorage.getItem(keys.email) || sessionStorage.getItem(keys.email) || '';

  return { unlocked, email };
}

export function persistEmailGate(scope: string, email: string): EmailGateState {
  const keys = getStorageKeys(scope);
  const normalizedEmail = String(email || '').trim().toLowerCase();

  localStorage.setItem(keys.unlocked, '1');
  sessionStorage.setItem(keys.unlocked, '1');
  localStorage.setItem(keys.email, normalizedEmail);
  sessionStorage.setItem(keys.email, normalizedEmail);

  return { unlocked: true, email: normalizedEmail };
}

export function isValidEmailGateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}
