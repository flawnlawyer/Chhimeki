// register.js — Registration form validation & step flow

const RegisterForm = (() => {
  const FIELDS_STEP1 = ['fullName', 'username', 'email', 'password', 'confirmPassword'];
  const FIELDS_STEP2 = ['phone', 'country', 'terms'];

  const validators = {
    fullName(value) {
      const v = value.trim();
      if (!v) return 'Full name is required.';
      if (v.length < 2) return 'Enter at least 2 characters.';
      if (!/^[a-zA-Z\u0900-\u097F\s.'-]+$/.test(v)) {
        return 'Name can only contain letters, spaces, and hyphens.';
      }
      return '';
    },

    username(value) {
      const v = value.trim();
      if (!v) return 'Username is required.';
      if (v.length < 3) return 'Username must be at least 3 characters.';
      if (v.length > 20) return 'Username must be 20 characters or fewer.';
      if (!/^[a-zA-Z0-9_]+$/.test(v)) {
        return 'Use only letters, numbers, and underscores.';
      }
      if (typeof isUsernameTaken === 'function' && isUsernameTaken(v)) {
        return 'This username is already taken.';
      }
      return '';
    },

    email(value) {
      const v = value.trim();
      if (!v) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        return 'Enter a valid email address.';
      }
      if (typeof isEmailTaken === 'function' && isEmailTaken(v)) {
        return 'This email is already registered.';
      }
      return '';
    },

    password(value) {
      if (!value) return 'Password is required.';
      if (value.length < 8) return 'Password must be at least 8 characters.';
      if (!/[a-z]/.test(value)) return 'Include at least one lowercase letter.';
      if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter.';
      if (!/[0-9]/.test(value)) return 'Include at least one number.';
      return '';
    },

    confirmPassword(value, form) {
      if (!value) return 'Please confirm your password.';
      if (value !== form.password.value) return 'Passwords do not match.';
      return '';
    },

    phone(value) {
      const v = value.trim();
      if (!v) return 'Phone number is required.';
      const digits = v.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        return 'Enter a valid phone number (7–15 digits).';
      }
      return '';
    },

    country(value) {
      if (!value) return 'Please select your country.';
      return '';
    },

    terms(_value, form) {
      if (!form.terms.checked) return 'You must accept the terms and conditions.';
      return '';
    }
  };

  let currentStep = 1;
  let els = {};

  /** Score password strength: weak | fair | good | strong */
  function getPasswordStrength(password) {
    if (!password) return { level: '', score: 0, label: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 'weak', score, label: 'Weak — add more variety' };
    if (score === 3) return { level: 'fair', score, label: 'Fair — almost there' };
    if (score === 4) return { level: 'good', score, label: 'Good password' };
    return { level: 'strong', score, label: 'Strong password' };
  }

  function updatePasswordStrength() {
    const { level, label } = getPasswordStrength(els.password.value);
    els.strengthFill.className = 'strength-fill' + (level ? ` ${level}` : '');
    els.strengthLabel.className = 'strength-label' + (level ? ` ${level}` : '');
    els.strengthLabel.textContent = els.password.value ? label : '';
    els.strengthMeter.setAttribute('aria-valuenow', level === 'weak' ? 25 : level === 'fair' ? 50 : level === 'good' ? 75 : level === 'strong' ? 100 : 0);
  }

  function setFieldState(fieldId, error) {
    const input = els[fieldId];
    const errEl = els[`${fieldId}Err`];
    if (!input) return;

    input.classList.toggle('error', !!error);
    input.classList.toggle('valid', !error && input.value.trim() !== '');
    input.setAttribute('aria-invalid', error ? 'true' : 'false');

    if (errEl) {
      errEl.textContent = error;
      input.setAttribute('aria-describedby', error ? `${fieldId}Err` : '');
    }
  }

  function validateField(fieldId) {
    const input = els[fieldId];
    if (!input) return true;

    const validator = validators[fieldId];
    if (!validator) return true;

    const error = validator(input.type === 'checkbox' ? input.checked : input.value, els.form);
    setFieldState(fieldId, error);
    return !error;
  }

  function validateStep(fields) {
    let valid = true;
    fields.forEach((id) => {
      if (!validateField(id)) valid = false;
    });
    return valid;
  }

  function goToStep(step) {
    currentStep = step;

    els.steps.forEach((el) => {
      const n = Number(el.dataset.step);
      const isActive = n === step;
      el.classList.toggle('active', isActive);
      el.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    els.dots.forEach((dot) => {
      const n = Number(dot.dataset.step);
      dot.classList.toggle('active', n === step);
      dot.classList.toggle('completed', n < step);
    });

    els.lines.forEach((line, i) => {
      line.classList.toggle('filled', i < step - 1);
    });

    const activeDot = els.dots.find((d) => Number(d.dataset.step) === step);
    if (activeDot) activeDot.querySelector('span').focus();

    const firstInput = els.steps.find((s) => Number(s.dataset.step) === step)?.querySelector('input, select');
    if (firstInput) setTimeout(() => firstInput.focus(), 280);
  }

  function showSuccess(user) {
    els.formWrapper.hidden = true;
    els.stepIndicator.hidden = true;
    els.loginLink.hidden = true;
    els.successState.hidden = false;
    els.successState.setAttribute('aria-live', 'polite');

    const nameEl = document.getElementById('successUserName');
    if (nameEl) nameEl.textContent = user.name.split(' ')[0];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep(FIELDS_STEP2)) return;

    els.submitBtn.classList.add('is-loading');
    els.submitBtn.disabled = true;
    els.submitBtn.setAttribute('aria-busy', 'true');

    await new Promise((r) => setTimeout(r, 900));

    const result = registerUser({
      name: els.fullName.value,
      username: els.username.value,
      email: els.email.value,
      password: els.password.value,
      phone: els.phone.value,
      country: els.country.value
    });

    els.submitBtn.classList.remove('is-loading');
    els.submitBtn.disabled = false;
    els.submitBtn.removeAttribute('aria-busy');

    if (!result.success) {
      if (result.error.includes('email')) setFieldState('email', result.error);
      else if (result.error.includes('username')) setFieldState('username', result.error);
      return;
    }

    showSuccess(result.user);
  }

  function bindPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.togglePassword;
        const input = document.getElementById(targetId);
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
        btn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
        btn.textContent = isHidden ? '🙈' : '👁';
      });
    });
  }

  function bindTermsModal() {
    const modal = document.getElementById('termsModal');
    const openBtn = document.getElementById('termsLink');
    const closeBtn = document.getElementById('termsClose');
    const acceptBtn = document.getElementById('termsAccept');

    if (!modal) return;

    const open = () => {
      modal.hidden = false;
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      modal.hidden = true;
      document.body.style.overflow = '';
      openBtn.focus();
    };

    openBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });

    closeBtn?.addEventListener('click', close);
    acceptBtn?.addEventListener('click', () => {
      els.terms.checked = true;
      setFieldState('terms', '');
      close();
    });

    modal.querySelector('.terms-overlay')?.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (!modal.hidden && e.key === 'Escape') close();
    });
  }

  function hideSkeleton() {
    const skeleton = document.getElementById('register-skeleton');
    const card = document.getElementById('register-card');
    if (skeleton) skeleton.hidden = true;
    if (card) card.hidden = false;
  }

  function cacheElements() {
    els = {
      form: document.getElementById('registerForm'),
      formWrapper: document.getElementById('registerFormWrapper'),
      stepIndicator: document.getElementById('stepIndicator'),
      successState: document.getElementById('successState'),
      loginLink: document.getElementById('loginLink'),
      steps: [...document.querySelectorAll('.form-step')],
      dots: [...document.querySelectorAll('.step-dot')],
      lines: [...document.querySelectorAll('.step-line')],
      fullName: document.getElementById('fullName'),
      username: document.getElementById('username'),
      email: document.getElementById('email'),
      password: document.getElementById('password'),
      confirmPassword: document.getElementById('confirmPassword'),
      phone: document.getElementById('phone'),
      country: document.getElementById('country'),
      terms: document.getElementById('terms'),
      strengthFill: document.getElementById('strengthFill'),
      strengthLabel: document.getElementById('strengthLabel'),
      strengthMeter: document.getElementById('strengthMeter'),
      submitBtn: document.getElementById('submitBtn'),
      step1Next: document.getElementById('step1Next'),
      step2Back: document.getElementById('step2Back')
    };

    FIELDS_STEP1.concat(FIELDS_STEP2).forEach((id) => {
      els[`${id}Err`] = document.getElementById(`${id}Err`);
    });
  }

  function bindEvents() {
    els.step1Next?.addEventListener('click', () => {
      if (validateStep(FIELDS_STEP1)) goToStep(2);
    });

    els.step2Back?.addEventListener('click', () => goToStep(1));

    els.form?.addEventListener('submit', handleSubmit);

    [...FIELDS_STEP1, ...FIELDS_STEP2].forEach((id) => {
      const input = els[id];
      if (!input) return;

      const event = input.type === 'checkbox' ? 'change' : 'blur';
      input.addEventListener(event, () => validateField(id));

      if (id === 'password') {
        input.addEventListener('input', () => {
          updatePasswordStrength();
          if (els.confirmPassword.value) validateField('confirmPassword');
        });
      }

      if (id === 'confirmPassword') {
        input.addEventListener('input', () => {
          if (els.confirmPassword.value) validateField('confirmPassword');
        });
      }

      if (id === 'username' || id === 'email') {
        input.addEventListener('input', () => {
          input.classList.remove('valid');
          const errEl = els[`${id}Err`];
          if (errEl) errEl.textContent = '';
          input.classList.remove('error');
        });
      }
    });
  }

  async function init() {
    if (!document.getElementById('registerForm')) return;

    await seedUsersIfNeeded();
    cacheElements();
    bindPasswordToggles();
    bindTermsModal();
    bindEvents();

    setTimeout(hideSkeleton, 480);
    goToStep(1);
  }

  return { init };
})();
