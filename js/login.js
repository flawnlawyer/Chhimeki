// login.js — Login form

const LoginForm = (() => {
  async function init() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    await seedUsersIfNeeded();

    const user = getCurrentUser();
    if (user) {
      redirectAfterLogin(user);
      return;
    }

    form.addEventListener('submit', handleSubmit);

    document.querySelector('[data-toggle-password]')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const input = document.getElementById('loginPassword');
      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
      btn.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
      btn.textContent = hidden ? '🙈' : '👁';
    });
  }

  function redirectAfterLogin(user) {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (user.role === 'admin') {
      window.location.href = redirect === 'admin.html' ? 'admin.html' : 'admin.html';
      return;
    }
    if (redirect && redirect !== 'admin.html') {
      window.location.href = redirect;
      return;
    }
    window.location.href = 'dashboard.html';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginErr');
    const btn = document.getElementById('loginBtn');

    errEl.textContent = '';
    if (!identifier) {
      errEl.textContent = 'Enter your email or username.';
      return;
    }
    if (!password) {
      errEl.textContent = 'Enter your password.';
      return;
    }

    btn.classList.add('is-loading');
    btn.disabled = true;

    await new Promise((r) => setTimeout(r, 400));

    const result = login(identifier, password);
    btn.classList.remove('is-loading');
    btn.disabled = false;

    if (!result.success) {
      errEl.textContent = result.error;
      document.getElementById('loginPassword').classList.add('error');
      return;
    }

    redirectAfterLogin(result.user);
  }

  return { init };
})();
