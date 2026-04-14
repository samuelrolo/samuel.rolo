const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

const loginSection = document.getElementById('login-section');
const toolsSection = document.getElementById('tools-section');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');

// Check if user is already logged in
chrome.storage.local.get(['session'], (result) => {
  if (result.session) {
    showTools(result.session.user);
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  setLoading(true);
  errorMessage.classList.add('hidden');

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      chrome.storage.local.set({ session: data }, () => {
        showTools(data.user);
      });
    } else {
      showError(data.error_description || data.error || 'Erro ao fazer login.');
    }
  } catch (error) {
    showError('Erro de ligação ao servidor.');
  } finally {
    setLoading(false);
  }
});

logoutBtn.addEventListener('click', () => {
  chrome.storage.local.remove(['session'], () => {
    loginSection.classList.remove('hidden');
    toolsSection.classList.add('hidden');
    emailInput.value = '';
    passwordInput.value = '';
  });
});

function showTools(user) {
  loginSection.classList.add('hidden');
  toolsSection.classList.remove('hidden');
  
  // Try to get first name from user metadata
  const firstName = user.user_metadata?.first_name || user.email.split('@')[0];
  userNameSpan.textContent = firstName;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  loginBtn.textContent = isLoading ? 'A entrar...' : 'Entrar';
}
