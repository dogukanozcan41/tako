import { login, getSession } from './api.js';

const form = document.querySelector('#login-form');
const feedback = document.querySelector('.form__feedback');

async function init() {
  try {
    const session = await getSession();
    if (session?.user) {
      window.location.replace('/dashboard.html');
      return;
    }
  } catch (error) {
    // oturum yok, giriş formu gösterilmeye devam eder
  }

  form?.addEventListener('submit', handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const credentials = {
    username: formData.get('username')?.toString().trim(),
    password: formData.get('password')?.toString() ?? '',
  };

  if (!credentials.username || credentials.password.length < 6) {
    showError('Lütfen geçerli bir kullanıcı adı ve en az 6 karakterlik parola girin.');
    return;
  }

  toggleFormState(true);
  try {
    await login(credentials);
    window.location.replace('/dashboard.html');
  } catch (error) {
    const message = error?.message ?? 'Giriş yapılamadı. Lütfen tekrar deneyin.';
    showError(message);
  } finally {
    toggleFormState(false);
  }
}

function toggleFormState(isSubmitting) {
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap';
  }
  form.classList.toggle('is-loading', isSubmitting);
}

function showError(message) {
  feedback.textContent = message;
  feedback.hidden = false;
}

init();
